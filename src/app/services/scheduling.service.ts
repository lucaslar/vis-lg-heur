import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Job} from '../model/Job';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {PriorityRule} from '../model/enums/PriorityRule';
import {Machine} from '../model/Machine';
import {ScheduledJob} from '../model/ScheduledJob';
import {
  GeneralSchedulingData, MachineVisualizableData,
  SchedulingResult,
  SolutionQualityData,
  VisualizableSolutionQualityData
} from '../model/internal/SchedulingResult';
import {Heuristic} from '../model/Heuristic';

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

    // TODO Define these values
    data.machineData = this.generateMachineData();
    data.allMachineOperationStartsAtTimestamp = undefined;
    data.cumulatedDelaysAtTimestamps = undefined;
    data.percentageOfFinishedJobsAtTimestamp = undefined;
    data.totalPercentageOfDelayedJobs = undefined;

    return data;
  }

  private generateMachineData(): MachineVisualizableData[] {
    /* Previous approach
    const a = this.machines
      .map(machine => this.jobs
      // .sort((j1, j2) =>
      //  j1.operationsOnMachines.find(o => o.machineNr === machine.machineNr).startTimestamp
      //  - j2.operationsOnMachines.find(o => o.machineNr === machine.machineNr).startTimestamp)
        .map(job => job.operationsOnMachines.find(operation => operation.machineNr === machine.machineNr)
        ));
     */
    /*
    const a = this.machines
      .map(machine => this.jobs
        .filter(job => job.operationsOnMachines
          .find(operation => operation.machineNr === machine.machineNr)
        ));
        */

    const a = [];
    this.machines
      .forEach(machine => {
        // const b = new Map<number, ScheduledJob>();
        const b = new Map<number, string>();
        this.jobs.forEach(job =>
          // b.set(job.operationsOnMachines.find(o => o.machineNr === machine.machineNr).startTimestamp, job)
          b.set(job.operationsOnMachines.find(o => o.machineNr === machine.machineNr).startTimestamp, job.name)
        );
        a.push(b);
      });

    console.log(a);
    return [];
  }
}
