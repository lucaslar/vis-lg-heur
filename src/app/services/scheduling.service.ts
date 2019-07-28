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

  constructor(public storage: StorageService) {
  }

  // TODO: Keep percentage instead of concrete numbers?
  // TODO Log procedure

  scheduleUsingHeuristic(heuristicDefiner: HeuristicDefiner): SchedulingResult {
    this.initialize(heuristicDefiner);

    const tStart = performance.now();
    do {
      this.proceedScheduling();
      this.currentTimestampInScheduling++;
    } while (this.jobs.some(job => job.nextMachineNr !== undefined));

    const schedulingData = this.generateSchedulingResult();
    schedulingData.generalData.durationInMillis = performance.now() - tStart;
    return schedulingData;
  }

  private initialize(heuristicDefiner: HeuristicDefiner): void {
    // (Deep) copied values from storage cannot be undefined when this code is reached
    const deepCopiedJobs: Job[] = JSON.parse(JSON.stringify(this.storage.jobs));
    this.jobs = deepCopiedJobs.map(job => new ScheduledJob(job));
    this.machines = this.jobs[0].machineTimes.map(m => new Machine(m.machineNr)).sort();
    this.currentTimestampInScheduling = 0;
    this.heuristicType = heuristicDefiner;
    if (heuristicDefiner === HeuristicDefiner.PRIORITY_RULES) {
      this.priorityRules = <PriorityRule[]>JSON.parse(JSON.stringify(this.storage.priorityRules));
    }
  }

  private proceedScheduling(): void {
    this.handleEachCurrentJobOfMachine();
    this.addJobsToMachineQueues();
    // TODO: Only if queue changed? / For new queues?
    this.sortJobsInQueuesBasedOnHeuristic(); // Implementations of heuristics called in this method and its called methods
    this.setNextJobForEachFreeMachine();
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
      }
    });
  }

  // Called for any heuristic (after calling the heuristic itself)
  private setNextJobForEachFreeMachine(): void {
    this.machines
      .filter(machine => !machine.currentJob && machine.jobQueue.length)
      .forEach(machine => machine.startProductionOfNext(this.currentTimestampInScheduling));
  }

  // Implementation of heuristics starts here
  private sortJobsInQueuesBasedOnHeuristic(): void {
    this.machines
      .map(machine => machine.jobQueue)
      .forEach(queue => queue
        .sort((jobA: ScheduledJob, jobB: ScheduledJob) =>
          this.comparisonResultForCurrentHeuristic(jobA, jobB)
        )
      );
  }

  private comparisonResultForCurrentHeuristic(jobA: ScheduledJob, jobB: ScheduledJob): number {
    if (this.heuristicType === HeuristicDefiner.PRIORITY_RULES) {
      return this.compareJobsByPriorityRules(jobA, jobB);
    } else {
      // TODO: Implement more heuristics by implementing sorting here
      console.log('Implement me (' + this.heuristicType + '!');
      return 0;
    }
  }

  private compareJobsByPriorityRules(jobA: ScheduledJob, jobB: ScheduledJob): number {
    for (const priorityRule of this.priorityRules) {
      if (priorityRule === PriorityRule.FCFS) {
        return 0;
      } else {
        const aPriorityValue = this.getPriorityValueForJob(jobA, priorityRule);
        const bPriorityValue = this.getPriorityValueForJob(jobB, priorityRule);

        if (aPriorityValue < bPriorityValue) {
          return -1;
        } else if (bPriorityValue < aPriorityValue) {
          return 1;
        }
        // No else-block since in case of no clear result, the next priority rule is to be taken.
        // Returning 0 does only make sense if no more rules are available or for FCFS
      }
    }
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
    result.vizualizableGeneralData = this.generateVisualizableGeneralData();
    result.solutionQualityData = this.generateSolutionQuality();
    result.visualizableSolutionQualityData = this.generateVisualizableSolutionQualityData();
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
    data.totalDurationOnMachines = this.generateTotalDurationOnMachinesVisualization();
    data.totalJobTimes = this.generateTotalJobTimesVisualization();
    return data;
  }

  private generateTotalDurationOnMachinesVisualization(): ChartData {
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

  private generateSolutionQuality(): Kpi[] {
    const data = [];
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
    kpi.iconClasses = ['fas', 'fa-history'];
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
    kpi.iconClasses = ['fas', 'fa-tachometer-alt'];
    kpi.title = 'Maximale Verspätung';
    kpi.kpi = this.jobs
      .map(job => job.delay)
      .reduce((prevDelay, currentDelay) => prevDelay > currentDelay ? prevDelay : currentDelay);
    return kpi;
  }

  private generateVisualizableSolutionQualityData(): VisualizableSolutionQualityData {
    const data = new VisualizableSolutionQualityData();

    // TODO Define this value after final type definition
    data.allMachineOperationStartsAtTimestamp = this.generateAllMachineOperationsAtTimestamp();
    data.percentageOfFinishedJobsAtTimestamp = this.generatePercentageOfFinishedJobsAtTimestampVisualization();

    if (this.jobs[0].dueDate) {
      data.cumulatedDelaysAtTimestamps = this.generateCumulatedDelaysVisualization();
      data.totalPercentageOfDelayedJobs = this.generateTotalPercentageOfDelayedJobs();
    }

    return data;
  }

  private generateAllMachineOperationsAtTimestamp(): TimelineData {
    const visualization = new TimelineData();
    visualization.timelineData = [];
    this.jobs.forEach(job => {
      job.operationsOnMachines.sort((o1, o2) => o1.machineNr - o2.machineNr)
        .forEach(operation => {

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
        });
    });
    return visualization;
  }

  private generatePercentageOfFinishedJobsAtTimestampVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Prozentual fertiggestellte Aufträge';

    const sortedJobs = this.getJobsSortedByFinishingDate();
    for (let i = 1; i <= sortedJobs[sortedJobs.length - 1].finishedAtTimestamp; i++) {
      const jobFinishedAtTimestamp = sortedJobs.find(job => job.finishedAtTimestamp === i);
      labels.push(jobFinishedAtTimestamp ? '' + i : '');
      dataset.data.push(jobFinishedAtTimestamp ?
        Math.round((sortedJobs.indexOf(jobFinishedAtTimestamp) + 1)
          / this.jobs.length * 10000) / 100 : undefined);
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Prozentual fertiggestellte Aufträge über die Gesamtbearbeitungszeit';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Zeiteinheiten';
    visualization.yLabel = 'Prozentual fertiggstellt';

    return visualization;
  }

  private generateCumulatedDelaysVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Kumulierte Verspätungszeiten';

    const sortedJobs = this.getJobsSortedByFinishingDate();
    const lastOperationEnd = sortedJobs[sortedJobs.length - 1].finishedAtTimestamp;
    for (let i = 1; i <= lastOperationEnd; i++) {
      const jobFinishedAtTimestamp = this.jobs.find(job => job.finishedAtTimestamp === i);
      const isDataToBeAdded = jobFinishedAtTimestamp && (jobFinishedAtTimestamp.delay || i === lastOperationEnd);
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

  private generateTotalPercentageOfDelayedJobs(): ChartData {
    const dataset = new Dataset();
    const labels = ['Rechtzeitig', 'Verspätet'];
    dataset.data = [];
    dataset.label = 'Aufträge';

    const nrDelayedJobs = this.jobs.filter(job => job.finishedAtTimestamp > job.dueDate).length;
    dataset.data.push((Math.round((this.jobs.length - nrDelayedJobs) / this.jobs.length * 10000) / 100));
    dataset.data.push((Math.round(nrDelayedJobs / this.jobs.length * 10000) / 100));

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.title = 'Prozentual rechtzeitig und verspätet fertiggestellte Aufträge';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Fertigstellungsstatus der Aufträge';
    visualization.yLabel = 'Prozentuale Anzahl';
    return visualization;
  }

  // TODO Percentage of all machines over time (0/1)

  private getJobsSortedByFinishingDate(): ScheduledJob[] {
    return this.jobs.sort((j1, j2) => j1.finishedAtTimestamp - j2.finishedAtTimestamp);
  }
}
