import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Job} from '../model/Job';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {PriorityRule} from '../model/enums/PriorityRule';
import {Machine} from '../model/Machine';
import {ScheduledJob} from '../model/ScheduledJob';

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

  scheduleUsingHeuristic(heuristicDefiner: HeuristicDefiner): Machine[] {
    this.initialize(heuristicDefiner);

    do {
      this.proceedScheduling();
      this.currentTimestamp++;
    } while (this.jobs.some(job => job.nextMachineNr !== undefined));

    console.log(
      this.machines.map(machine => this.jobs
        .sort((j1, j2) =>
          j1.operationsOnMachines.find(o => o.machineNr === machine.machineNr).startTimestamp
          - j2.operationsOnMachines.find(o => o.machineNr === machine.machineNr).startTimestamp)
        .map(job =>
          job.operationsOnMachines
            .filter(operation => operation.machineNr === machine.machineNr)
            .map(o => job.name + ': ' + o.startTimestamp + '-' + o.finishTimestamp)
        )
      )
    );

    // TODO: Change return type and value (Object for visualization?)
    return null;
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
}
