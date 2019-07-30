import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Job} from '../model/Job';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {PriorityRule} from '../model/enums/PriorityRule';
import {Machine} from '../model/Machine';
import {ScheduledJob} from '../model/ScheduledJob';
import {
  GeneralSchedulingData,
  Kpi,
  SchedulingResult,
  VisualizableGeneralData,
  VisualizableSolutionQualityData
} from '../model/internal/visualization/SchedulingResult';
import {Heuristic} from '../model/Heuristic';
import {ChartData, ChartType, Dataset, TimelineData} from '../model/internal/visualization/VisualizableData';

@Injectable({
  providedIn: 'root'
})
export class SchedulingService {

  private jobs: ScheduledJob[];
  private machines: Machine[];
  private heuristicType: HeuristicDefiner;
  private priorityRules: PriorityRule[];
  private currentTimestampInScheduling: number;

  private logging: [number, number, string][];

  constructor(public storage: StorageService) {
  }

  // TODO Log procedure

  scheduleUsingHeuristic(heuristicDefiner: HeuristicDefiner): SchedulingResult {
    this.initialize(heuristicDefiner);

    const tStart = performance.now();
    do {
      this.proceedScheduling();
      this.currentTimestampInScheduling++;
    } while (this.jobs.some(job => job.nextMachineNr !== undefined));

    const schedulingPerformance = performance.now() - tStart;
    const schedulingData = this.generateSchedulingResult();
    schedulingData.generalData.durationInMillisKpi = new Kpi();
    schedulingData.generalData.durationInMillisKpi.kpi = schedulingPerformance;
    schedulingData.generalData.durationInMillisKpi.title = 'Dauer der Berechnung in ms. (inkl. Logging)';
    schedulingData.generalData.durationInMillisKpi.iconClasses = ['fas', 'fa-stopwatch'];

    this.deleteTemporarilyStoredData();
    return schedulingData;
  }

  private initialize(heuristicDefiner: HeuristicDefiner): void {
    // (Deep) copied values from storage cannot be undefined when this code is reached
    const deepCopiedJobs: Job[] = JSON.parse(JSON.stringify(this.storage.jobs));
    this.jobs = deepCopiedJobs.map(job => new ScheduledJob(job));
    this.machines = this.jobs[0].machineTimes.map(m => new Machine(m.machineNr)).sort();
    this.logging = [];
    this.currentTimestampInScheduling = 0;
    this.heuristicType = heuristicDefiner;
    if (heuristicDefiner === HeuristicDefiner.PRIORITY_RULES) {
      this.priorityRules = <PriorityRule[]>JSON.parse(JSON.stringify(this.storage.priorityRules));
    }
  }

  private deleteTemporarilyStoredData(): void {
    delete this.jobs;
    delete this.machines;
    delete this.logging;
    delete this.currentTimestampInScheduling;
    delete this.heuristicType;
    delete this.priorityRules;
  }

  private proceedScheduling(): void {
    this.handleEachCurrentJobOfMachine();
    this.addJobsToMachineQueues();

    // Sort queues of free machines (with jobs in queue) and produce best job:
    this.machines
      .filter(machine => !machine.currentJob && machine.jobQueue.length)
      .forEach(machine => {
          this.logSchedulingProcedure(machine.machineNr,
            'Beginn der Sortierung der Warteschlange');
          machine.jobQueue.sort((jobA: ScheduledJob, jobB: ScheduledJob) =>
            this.comparisonResultForCurrentHeuristic(jobA, jobB, machine.machineNr)
          );
          machine.startProductionOfNext(this.currentTimestampInScheduling);
          this.logSchedulingProcedure(machine.machineNr,
            'Beginn der Abarbeitung von Auftrag ' + this.jobStringForLogging(machine.currentJob));
        }
      );
  }

  // Called for any heuristic (before calling the heuristic itself)
  private handleEachCurrentJobOfMachine(): void {
    this.machines
      .filter(machine => machine.currentJob)
      .forEach(machine => machine.freeIfCurrentJobOperationFinished(this.currentTimestampInScheduling));
  }

  // Called for any heuristic (before calling the heuristic itself)
  private addJobsToMachineQueues(): void {
    this.jobs
      .filter(job =>
        job.nextMachineNr !== undefined // Exclude jobs that are already finished
        && !this.machines.some(m => m.currentJob === job) // exclude jobs that are currently in production
      ).forEach(job => {
      const nextMachine = this.machines.find(m => m.machineNr === job.nextMachineNr);
      if (!nextMachine.jobQueue.includes(job)) { // only add jobs, that have not been pushed to queue already
        nextMachine.jobQueue.push(job);
        this.logSchedulingProcedure(nextMachine.machineNr, 'Hinzufügen zur Warteschlange von '
          + this.jobStringForLogging(job));
      }
    });
  }

  // Implementation of sorting based on heuristics starts here:
  private comparisonResultForCurrentHeuristic(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number): number {
    if (this.heuristicType === HeuristicDefiner.PRIORITY_RULES) {
      return this.compareJobsByPriorityRules(jobA, jobB, machineNr);
    } else {
      // TODO: Implement more heuristics by implementing sorting here
      console.log('Implement me (' + this.heuristicType + '!');
      return 0;
    }
  }

  private compareJobsByPriorityRules(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number): number {
    for (const priorityRule of this.priorityRules) {
      if (priorityRule === PriorityRule.FCFS) {
        this.logSchedulingProcedure(machineNr,
          PriorityRule.FCFS + ' angewandt auf ' + this.jobStringForLogging(jobA)
          + ' & ' + this.jobStringForLogging(jobB));
        return 0;
      } else {
        const aPriorityValue = this.getPriorityValueForJob(jobA, priorityRule);
        const bPriorityValue = this.getPriorityValueForJob(jobB, priorityRule);

        if (aPriorityValue < bPriorityValue) {
          this.logSchedulingProcedure(machineNr, 'Bevorzugen von ' + this.jobStringForLogging(jobA) + ' (Wert: ' + aPriorityValue
            + ') gegenüber ' + this.jobStringForLogging(jobB) + ' (' + bPriorityValue + ') aufgrund von Prioritätsregel: ' + priorityRule);
          return -1;
        } else if (bPriorityValue < aPriorityValue) {
          this.logSchedulingProcedure(machineNr, 'Bevorzugen von ' + this.jobStringForLogging(jobB) + ' (Wert: ' + bPriorityValue
            + ') gegenüber ' + this.jobStringForLogging(jobA) + ' (' + aPriorityValue + ') aufgrund von Prioritätsregel: ' + priorityRule);
          return 1;
        } else {
          this.logSchedulingProcedure(machineNr,
            'Betrachteter Wert für ' + this.jobStringForLogging(jobA) + ' & ' + this.jobStringForLogging(jobB) + ' identisch (' +
            aPriorityValue + '), daher keine Sortierung mithilfe von Prioritätsregel ' + priorityRule + ' möglich');
          // No return value since in case of no clear result, the next priority rule is to be taken.
          // Returning 0 does only make sense if no more rules are available or for FCFS

        }
      }
    }
    this.logSchedulingProcedure(machineNr,
      this.jobStringForLogging(jobA) + ' & ' + this.jobStringForLogging(jobB) + ' bezüglich aller betrachteten Prioritätsregeln '
      + 'identisch und somit nicht vergleichbar (Sortierung entspricht nun ' + PriorityRule.FCFS + ')');
    return 0;
  }

  private getPriorityValueForJob(job: ScheduledJob, priorityRule:
    // All rules except for FCFS
    PriorityRule.KOZ | PriorityRule.KPZ | PriorityRule.CRSPT | PriorityRule.MOD | PriorityRule.CR |
    PriorityRule.EDD | PriorityRule.FEZ | PriorityRule.ODD | PriorityRule.SOPN | PriorityRule.SOPT |
    PriorityRule.SPTT | PriorityRule.SZ): number {

    if (priorityRule === PriorityRule.KOZ) {
      return job.currentProcessingTime;

    } else if (priorityRule === PriorityRule.KPZ) {
      return job.getSlackTimeForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.CRSPT) {
      return job.getCriticalRatioOrProcessingTimeForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.MOD) {
      return job.getModifiedOperationalDueDateForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.CR) {
      return job.getCriticalValueForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.EDD) {
      return job.dueDate;

    } else if (priorityRule === PriorityRule.FEZ) {
      return job.getSoonestEndingTime(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.ODD) {
      return job.getTCornerForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.SOPN) {
      return job.getSopnForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.SOPT) {
      return job.getSoptForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.SPTT) {
      return job.getSpttForTimestamp(this.currentTimestampInScheduling);

    } else if (priorityRule === PriorityRule.SZ) {
      return job.slipTime;
    }

  }

  // called after successful scheduling
  private generateSchedulingResult(): SchedulingResult {
    const result = new SchedulingResult();
    result.generalData = this.generateGeneralSchedulingData();
    result.visualizableGeneralData = this.generateVisualizableGeneralData();
    result.solutionQualityData = this.generateSolutionQualityData();
    result.visualizableSolutionQualityData = this.generateVisualizableSolutionQualityData();
    result.schedulingLogging = this.logging;
    return result;
  }

  // result data generation starts here

  private generateGeneralSchedulingData(): GeneralSchedulingData {
    const data = new GeneralSchedulingData();
    data.machineConfig = this.storage.machineConfigParam;
    data.numberOfJobs = this.jobs.length;
    data.numberOfMachines = this.machines.length;
    data.usedHeuristic = Heuristic.getHeuristicByDefiner(this.heuristicType);
    data.priorityRules = this.priorityRules; // may be undefined
    return data;
  }

  private generateVisualizableGeneralData(): VisualizableGeneralData {
    const data = new VisualizableGeneralData();
    data.totalDurationsOnMachines = this.generateTotalDurationsOnMachinesVisualization();
    data.totalJobTimes = this.generateTotalJobTimesVisualization();
    return data;
  }

  private generateTotalDurationsOnMachinesVisualization(): ChartData {
    const sortedMachines = this.machines.sort((m1, m2) => m1.machineNr - m2.machineNr);
    const dataset = new Dataset();
    dataset.label = 'Summierte Dauer der Arbeitsgänge';
    dataset.data = sortedMachines
      .map(machine => this.jobs
        .map(job => job.machineTimes
          .find(m => m.machineNr === machine.machineNr).timeOnMachine).reduce((m1, m2) => m1 + m2, 0));

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.title = 'Summierte Dauer der Arbeitsgänge pro Maschine';
    visualization.labels = sortedMachines.map(machine => 'Maschine ' + machine.machineNr);
    visualization.datasets = [dataset];
    visualization.xLabel = 'Maschinen';
    visualization.yLabel = 'Zeiteinheiten';
    return visualization;
  }

  private generateTotalJobTimesVisualization(): ChartData {
    const sortedJobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    const dataset = new Dataset();
    dataset.data = sortedJobs
      .map(job => job.machineTimes
        .map(m => m.timeOnMachine)
        .reduce((m1, m2) => m1 + m2));
    dataset.label = 'Gesamtbearbeitungsdauer';

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.colors = this.getColorsAsSpecifiedInGanttWithLessOpacity();
    visualization.title = 'Gesamtbearbeitungsdauer ' +
      (sortedJobs[0].dueDate ? 'und gewünschte Fertigstellungstermine ' : '') + 'aller Aufträge';
    visualization.labels = sortedJobs.map(job => job.name + ' (ID: ' + job.id + ')');
    visualization.datasets = [dataset];
    visualization.xLabel = 'Aufträge';
    visualization.yLabel = 'Zeiteinheiten';

    if (sortedJobs[0].dueDate) {
      const dueDatesDataset = new Dataset();
      dueDatesDataset.data = sortedJobs.map(job => job.dueDate);
      dueDatesDataset.label = 'Gewünschter Fertigstellungstermin';
      visualization.datasets.push(dueDatesDataset);
    }

    return visualization;
  }

  private generateSolutionQualityData(): Kpi[] {
    const data = [];

    // TODO Mind start time here if implemented

    data.push(this.calculateTotalDurationKpi());
    data.push(this.calculateMeanCycleTimeKpi());
    data.push(this.calculateMeanJobBacklogKpi());

    // Either none or all jobs do have a due date here
    if (this.jobs[0].dueDate) {
      data.push(this.calculateMeanDelayKpi());
      data.push(this.calculateStandardDeviationOfDelayKpi());
      data.push(this.calculateSumOfDelaysKpi());
      data.push(this.calculateMaximumDelayKpi());
    }
    return data;
  }

  private calculateTotalDurationKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-stopwatch'];
    kpi.title = 'Gesamte Durchlaufzeit';
    kpi.kpi = this.currentTimestampInScheduling - 1;
    return kpi;
  }

  private calculateMeanCycleTimeKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-hourglass-half'];
    kpi.title = 'Mittlere Durchlaufzeit';
    kpi.kpi = +this.jobs
        .map(job => job.finishedAtTimestamp)
        .reduce((a, b) => a + b)
      / this.jobs.length;
    return kpi;
  }

  private calculateMeanJobBacklogKpi(): Kpi {
    let sum = 0;
    let maximum = 0;
    this.jobs.forEach(job => {
        sum += job.finishedAtTimestamp;
        maximum = job.finishedAtTimestamp > maximum ? job.finishedAtTimestamp : maximum;
      }
    );

    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-cubes'];
    kpi.title = 'Mittlerer Auftragsbestand';
    kpi.kpi = +(sum / maximum);
    return kpi;
  }

  private calculateMeanDelayKpi(): Kpi {
    const kpi = new Kpi();
    kpi.title = 'Mittlere Verspätung';
    kpi.kpi = +this.jobs
        .map(job => job.delay)
        .reduce((a, b) => a + b)
      / this.jobs.length;
    return kpi;
  }

  private calculateStandardDeviationOfDelayKpi(): Kpi {
    const mean = this.calculateMeanDelayKpi().kpi;

    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-code-branch'];
    kpi.title = 'Standardabweichung der Verspätung';
    kpi.kpi = +Math.sqrt(
      this.jobs
        .map(job => job.delay)
        .map(delay => (delay - mean) * (delay - mean)
        ).reduce((dev1, dev2) => dev1 + dev2
      )
      / (this.jobs.length - 1));
    return kpi;
  }

  private calculateSumOfDelaysKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['functions'];
    kpi.title = 'Summe der Verspätungen';
    kpi.kpi = +this.jobs
      .map(job => job.delay)
      .reduce((delay1, delay2) => delay1 + delay2);
    return kpi;
  }

  private calculateMaximumDelayKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-history'];
    kpi.title = 'Maximale Verspätung';
    kpi.kpi = this.jobs
      .map(job => job.delay)
      .reduce((prevDelay, currentDelay) => prevDelay > currentDelay ? prevDelay : currentDelay);
    return kpi;
  }

  private generateVisualizableSolutionQualityData(): VisualizableSolutionQualityData {
    const data = new VisualizableSolutionQualityData();

    data.allMachineOperationsTimeline = this.generateAllMachineOperationsTimeline();
    data.finishedJobsAtTimestamp = this.generateFinishedJobsAtTimestampVisualization();

    if (this.jobs[0].dueDate) {
      data.cumulatedDelaysAtTimestamps = this.generateCumulatedDelaysVisualization();
      data.comparisonDelayedAndInTimeJobs = this.generateComparisonDelayedAndInTimeVisualization();
    }

    return data;
  }

  private generateAllMachineOperationsTimeline(): TimelineData {
    const visualization = new TimelineData();
    visualization.timelineData = [];
    this.jobs.forEach(job => {
      for (let mnr = 1; mnr <= this.machines.length; mnr++) {
        const operation = job.operationsOnMachines.find(o => o.machineNr === mnr);
        // noinspection TypeScriptValidateTypes
        visualization.timelineData.push([
          'M' + operation.machineNr,
          'Auftrag mit ID ' + job.id + ': \'' + job.name + '\'',
          // Workaround in order to fix two problems in this context:
          // 1. Errors on too small devices since not all labels can be shown
          // 2. No or in case of many operations useful x-axis labels/categorizations/vertical lines
          new Date(operation.startTimestamp),
          new Date(operation.finishTimestamp)
        ]);
      }
    });
    visualization.colors = this.generateUniqueJobColorValues().map(color => 'rgb(' + color + ')');
    return visualization;
  }

  private generateFinishedJobsAtTimestampVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Fertiggestellte Aufträge';

    const sortedJobs = this.getJobsSortedByFinishingDate();
    for (let i = 1; i < this.currentTimestampInScheduling; i++) {
      const jobFinishedAtTimestamp = sortedJobs.find(job => job.finishedAtTimestamp === i);
      labels.push(jobFinishedAtTimestamp ? '' + i : '');
      dataset.data.push(jobFinishedAtTimestamp ?
        sortedJobs.indexOf(jobFinishedAtTimestamp) + 1 : undefined);
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Fertiggestellte Aufträge über die Gesamtbearbeitungszeit';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Zeiteinheiten';
    visualization.yLabel = 'Anzahl';

    return visualization;
  }

  private generateCumulatedDelaysVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Kumulierte Verspätungszeiten';

    for (let i = 1; i < this.currentTimestampInScheduling; i++) {
      const jobFinishedAtTimestamp = this.jobs.find(job => job.finishedAtTimestamp === i);
      const isDataToBeAdded = jobFinishedAtTimestamp && (jobFinishedAtTimestamp.delay || i === this.currentTimestampInScheduling - 1);
      labels.push(isDataToBeAdded ? '' + i : '');

      dataset.data.push(isDataToBeAdded ?
        Math.max(...dataset.data.filter(d => d !== undefined)) + jobFinishedAtTimestamp.delay : undefined);
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Kumulierte Verspätungszeiten';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Zeiteinheiten';
    visualization.yLabel = 'Kumulierte Verspätungszeiten';
    return visualization;
  }

  private generateComparisonDelayedAndInTimeVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['Rechtzeitig', 'Verspätet'];
    dataset.data = [];
    dataset.label = 'Aufträge';

    const nrDelayedJobs = this.jobs.filter(job => job.finishedAtTimestamp > job.dueDate).length;
    dataset.data.push(this.jobs.length - nrDelayedJobs);
    dataset.data.push(nrDelayedJobs);

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.title = 'Rechtzeitig und verspätet fertiggestellte Aufträge';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Fertigstellungsstatus der Aufträge';
    visualization.yLabel = 'Anzahl';
    return visualization;
  }

  private getJobsSortedByFinishingDate(): ScheduledJob[] {
    return this.jobs.sort((j1, j2) => j1.finishedAtTimestamp - j2.finishedAtTimestamp);
  }

  private generateUniqueJobColorValues(): string[] {

    // Google Charts default colors
    const baseRgbColors = [
      [66, 133, 244],
      [219, 68, 55],
      [15, 157, 88],
      [171, 71, 188],
      [244, 180, 0],
      [0, 121, 107],
      [255, 112, 67],
      [92, 107, 192],
      [194, 24, 91],
      [158, 157, 36],
      [240, 98, 146],
      [0, 172, 193]
    ];
    const newRgbColors: number[][] = [];

    const totalIterationsWithNewColors = this.jobs.length > baseRgbColors.length ?
      Math.ceil((this.jobs.length - baseRgbColors.length) / baseRgbColors.length) : 0;

    for (let i = 0; i < this.jobs.length; i++) {
      let percent = 0;
      if (totalIterationsWithNewColors) {
        const v = Math.ceil(((i < baseRgbColors.length ? 0 : i + 1 - baseRgbColors.length) / baseRgbColors.length));
        percent = v / totalIterationsWithNewColors * 20;
      }

      newRgbColors[i] = [];
      baseRgbColors[i % baseRgbColors.length].forEach(c => {
        let newValue = Math.floor((c * (100 + percent)) / 100);
        newValue = (newValue < 255) ? newValue : 255;
        newRgbColors[i].push(newValue);
      });
    }

    return newRgbColors.map(rgb => rgb[0] + ', ' + rgb[1] + ', ' + rgb[2]);
  }

  private getColorsAsSpecifiedInGanttWithLessOpacity(): string[] {

    let colors = this.generateUniqueJobColorValues()
      .map(color => 'rgba(' + color + ',0.8)');

    const sortedColors = [];
    for (let i = 0; i < this.currentTimestampInScheduling; i++) {
      const job = this.jobs.find(j => j.operationsOnMachines.find(o => o.machineNr === 1).startTimestamp === i);
      if (job) {
        sortedColors[job.id - 1] = colors[0];
        colors = colors.filter(color => color !== colors[0]);
      }
    }

    return sortedColors;
  }

  private logSchedulingProcedure(machineNr: number, description: string): void {
    // noinspection TypeScriptValidateTypes
    this.logging.push([this.currentTimestampInScheduling, machineNr, description]);
  }

  private jobStringForLogging(job: ScheduledJob): string {
    return '\'' + job.name + '\' (ID: ' + job.id + ')';
  }

}
