import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Job} from '../model/Job';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {PriorityRule} from '../model/enums/PriorityRule';
import {Machine} from '../model/Machine';
import {ScheduledJob} from '../model/ScheduledJob';
import {
  GeneralSchedulingData,
  SchedulingResult,
  SolutionQualityData,
  VisualizableGeneralData,
  VisualizableSolutionQualityData
} from '../model/internal/SchedulingResult';
import {Heuristic} from '../model/Heuristic';
import {ChartData, ChartType, Dataset, TimelineData} from '../model/internal/VisualizableData';

@Injectable({
  providedIn: 'root'
})
export class SchedulingService {

  private jobs: ScheduledJob[];
  private machines: Machine[];
  private heuristicType: HeuristicDefiner;
  private priorityRules: PriorityRule[];
  private currentTimestamp: number;

  constructor(public storage: StorageService) {
  }

  scheduleUsingHeuristic(heuristicDefiner: HeuristicDefiner): SchedulingResult {
    this.initialize(heuristicDefiner);

    // TODO Time duration?

    do {
      this.proceedScheduling();
      this.currentTimestamp++;
    } while (this.jobs.some(job => job.nextMachineNr !== undefined));

    return this.generateSchedulingResult();
  }

  private initialize(heuristicDefiner: HeuristicDefiner): void {
    // (Deep) copied values from storage cannot be undefined when this code is reached
    const deepCopiedJobs: Job[] = JSON.parse(JSON.stringify(this.storage.jobs));
    this.jobs = deepCopiedJobs.map(job => new ScheduledJob(job));
    this.machines = this.jobs[0].machineTimes.map(m => new Machine(m.machineNr)).sort();
    this.currentTimestamp = 0;
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
      .forEach(machine => machine.freeIfCurrentJobOperationFinished(this.currentTimestamp));
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
      .forEach(machine => machine.startProductionOfNext(this.currentTimestamp));
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
      return job.getSlackTimeForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.CRSPT) {
      return job.getCriticalRatioOrProcessingTimeForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.MOD) {
      return job.getModifiedOperationalDueDateForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.CR) {
      return job.getCriticalValueForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.EDD) {
      return job.dueDate;

    } else if (priorityRule === PriorityRule.FEZ) {
      return job.getSoonestEndingTime(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.ODD) {
      return job.getTCornerForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.SOPN) {
      return job.getSopnForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.SOPT) {
      return job.getSoptForTimestamp(this.currentTimestamp);

    } else if (priorityRule === PriorityRule.SPTT) {
      return job.getSpttForTimestamp(this.currentTimestamp);

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
    dataset.data = sortedMachines
      .map(machine => this.jobs
        .map(job => job.machineTimes
          .find(m => m.machineNr === machine.machineNr).timeOnMachine).reduce((m1, m2) => m1 + m2, 0));

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.title = 'Summierte Dauer der Arbeitsgänge pro Machine';
    visualization.labels = sortedMachines.map(machine => 'Maschine ' + machine.machineNr);
    visualization.datasets = [dataset];
    return visualization;
  }

  private generateTotalJobTimesVisualization(): ChartData {
    const sortedJobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    const dataset = new Dataset();
    dataset.data = sortedJobs
      .map(job => job.machineTimes
        .map(m => m.timeOnMachine)
        .reduce((m1, m2) => m1 + m2));

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.title = 'Gesamtbearbeitungsdauer aller Aufträge';
    visualization.labels = sortedJobs.map(job => job.name + ' (ID: ' + job.id + ')');
    visualization.datasets = [dataset];
    return visualization;
  }

  private generateSolutionQuality(): SolutionQualityData {
    const data = new SolutionQualityData();
    data.totalDuration = this.currentTimestamp - 1;
    data.meanCycleTime = this.calculateMeanCycleTime();
    data.meanJobBacklog = this.calculateMeanJobBacklog();

    // Either none or all jobs do have a due date here
    if (this.jobs[0].dueDate) {
      data.meanDelay = this.calculateMeanDelay();
      data.standardDeviationOfDelay = this.calculateStandardDeviationOfDelay();
      data.sumOfDelays = this.calculateSumOfDelays();
      data.maximumDelay = this.calculateMaximumDelay();
    }
    return data;
  }

  private calculateMeanCycleTime(): number {
    return +this.jobs
        .map(job => job.finishedAtTimestamp)
        .reduce((a, b) => a + b)
      / this.jobs.length;
  }

  private calculateMeanJobBacklog(): number {
    let sum = 0;
    let maximum = 0;
    this.jobs.forEach(job => {
        sum += job.finishedAtTimestamp;
        maximum = job.finishedAtTimestamp > maximum ? job.finishedAtTimestamp : maximum;
      }
    );
    return +(sum / maximum);
  }

  private calculateMeanDelay(): number {
    return +this.jobs
        .map(job => job.delay)
        .reduce((a, b) => a + b)
      / this.jobs.length;
  }

  private calculateStandardDeviationOfDelay(): number {
    const mean = this.calculateMeanDelay();
    return +Math.sqrt(
      this.jobs
        .map(job => job.delay)
        .map(delay => (delay - mean) * (delay - mean)
        ).reduce((dev1, dev2) => dev1 + dev2
      )
      / (this.jobs.length - 1));
  }

  private calculateSumOfDelays(): number {
    return +this.jobs
      .map(job => job.delay)
      .reduce((delay1, delay2) => delay1 + delay2);
  }

  private calculateMaximumDelay(): number {
    return this.jobs
      .map(job => job.delay)
      .reduce((prevDelay, currentDelay) => prevDelay > currentDelay ? prevDelay : currentDelay);
  }

  private generateVisualizableSolutionQualityData(): VisualizableSolutionQualityData {
    const data = new VisualizableSolutionQualityData();

    // TODO Define this value after final type definition
    data.allMachineOperationStartsAtTimestamp = this.generateAllMachineOperationsAtTimestamp();
    data.percentageOfFinishedJobsAtTimestamp = this.generatePercentageOfFinishedJobsAtTimestampVisualization();

    if (this.jobs[0].dueDate) {
      data.cumulatedDelaysAtTimestamps = this.generateCumulatedDelaysVisualization();
      data.totalPercentageOfDelayedJobs = undefined;
    }

    return data;
  }

  // TODO Differet type?
  private generateAllMachineOperationsAtTimestamp(): TimelineData {
    const visualization = new TimelineData();
    visualization.title = 'Prozentual fertiggestellte Jobs über die Gesambearbeitungszeit';
    visualization.timelineData = [];
    // TODO: Better way?
    // TODO Sort machines?
    this.jobs.map(job => job.operationsOnMachines)
      .forEach(operations => operations
        .sort((o1, o2) => o1.machineNr - o2.machineNr)
        .forEach(operation => {
            // noinspection TypeScriptValidateTypes
            visualization.timelineData.push([
              'Maschine ' + operation.machineNr,
              new Date(operation.startTimestamp),
              new Date(operation.finishTimestamp)
            ]);
          }
        ));
    return visualization;
  }

  private generatePercentageOfFinishedJobsAtTimestampVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = [];
    dataset.data = [];
    dataset.label = 'Prozentual fertiggestellte Aufträge';
    labels.push('t = 0');
    dataset.data.push(0);

    const sortedJobs = this.getJobsSortedByFinishingDate();
    for (let i = 1; i <= sortedJobs.length; i++) {
      dataset.data.push(((i / sortedJobs.length) * 100)); // TODO Round value
      labels.push('t = ' + sortedJobs[i - 1].finishedAtTimestamp);
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Prozentual fertiggestellte Jobs über die Gesambearbeitungszeit';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    return visualization;
  }

  private generateCumulatedDelaysVisualization(): ChartData {

    const dataset = new Dataset();
    const labels = [];
    dataset.data = [];
    dataset.label = 'Kumulierte Verspätungen';
    labels.push('t = 0');
    dataset.data.push(0);

    const sortedJobs = this.getJobsSortedByFinishingDate();
    sortedJobs.forEach(job => {
        if (job.delay || job === sortedJobs[sortedJobs.length - 1]) {
          labels.push('t = ' + job.finishedAtTimestamp.toString());
          dataset.data.push(
            dataset.data.length > 1 ? // Any item except for 0 for beginning?
              dataset.data[dataset.data.length - 1] + job.delay // add next delay to sum
              : job.delay); // first delay
        }
      }
    );

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Kumulierte Verspätungen';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    return visualization;
  }

  // TODO Percentage of all machines over time (0/1)

  private getJobsSortedByFinishingDate(): ScheduledJob[] {
    return this.jobs.sort((j1, j2) => j1.finishedAtTimestamp - j2.finishedAtTimestamp);
  }
}
