import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Job} from '../model/Job';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {PriorityRule} from '../model/enums/PriorityRule';
import {Machine} from '../model/Machine';
import {RelaxableOneMachineScheduledJob, ScheduledJob} from '../model/ScheduledJob';
import {
  GeneralSchedulingData,
  Kpi,
  MachineTableData,
  MachineTableEntry,
  SchedulingLogEntry,
  SchedulingResult,
  SchedulingTimesData,
  VisualizableGeneralData,
  VisualizableSolutionQualityData
} from '../model/internal/visualization/SchedulingResult';
import {ChartData, ChartType, Dataset, TimelineData} from '../model/internal/visualization/VisualizableData';
import {LogEventType} from '../model/enums/LogEventType';
import {DefinableValue} from '../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../model/internal/value-definition/DefinitionStatus';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';
import {SchedulingPlanForMachine} from '../model/SchedulingPlanForMachine';
import {BottleneckRelation} from '../model/internal/relations/BottleneckRelation';
import {DialogContent} from '../model/internal/dialog/DialogContent';
import {DialogType} from '../model/internal/dialog/DialogType';

@Injectable({
  providedIn: 'root'
})
export class SchedulingService {

  private objectiveFunction: ObjectiveFunction;
  private heuristicType: HeuristicDefiner;
  private priorityRules: PriorityRule[];

  private jobs: ScheduledJob[];
  private machines: Machine[];
  private currentTimestampInScheduling: number;
  private localSearchBestValuesForIterations: number[];

  private isLoggingConfigured: boolean;
  private logging: SchedulingLogEntry[];

  // TODO content: also add gamma to general data result
  // TODO content: Round results in avg. setup times diagrams % 0.005?

  constructor(public storage: StorageService) {
  }

  getComplexityWarning(heuristicDefiner: HeuristicDefiner): DialogContent | undefined {
    if (heuristicDefiner === HeuristicDefiner.LOCAL_SEARCH) {
      return this.getLocalSearchWarningIfNeeded();
    } else if (heuristicDefiner === HeuristicDefiner.SHIFTING_BOTTLENECK) {
      return this.getShiftingBottleneckWarningIfNeeded();
    } else {
      return undefined;
    }
  }

  scheduleUsingHeuristic(heuristicDefiner: HeuristicDefiner): SchedulingResult {
    this.initialize(heuristicDefiner);

    const tStart = performance.now();
    if (heuristicDefiner === HeuristicDefiner.SHIFTING_BOTTLENECK) {
      this.scheduleByShiftingBottleneckHeuristic();
    } else if (this.heuristicType === HeuristicDefiner.PRIORITY_RULES || this.heuristicType === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      do {
        this.proceedDynamicScheduling();
        this.currentTimestampInScheduling++;
      } while (this.jobs.some(job => job.nextMachineNr !== undefined));
    } else {
      this.scheduleStatically();
    }

    const schedulingPerformance = performance.now() - tStart;
    const schedulingData = this.generateSchedulingResult();
    schedulingData.generalData.durationInMillisKpi = new Kpi();
    schedulingData.generalData.durationInMillisKpi.kpi = schedulingPerformance;
    schedulingData.generalData.durationInMillisKpi.title = 'Dauer der Berechnung in ms.' +
      (this.isLoggingConfigured ? ' (inkl. Logging)' : '');
    schedulingData.generalData.durationInMillisKpi.iconClasses = ['fas', 'fa-stopwatch'];

    this.deleteTemporarilyStoredData();
    return schedulingData;
  }

  private getLocalSearchWarningIfNeeded(): DialogContent | undefined {
    if (this.storage.jobs.length >= 35) {
      return new DialogContent(
        'Lösen des Reihenfolgeproblems bestätigen',
        [
          'Das aktuelle Problem ist zwar mithilfe einer lokalen Suche lösbar, mit seinen ' + this.storage.jobs.length +
          ' Aufträgen allerdings recht komplex.',
          'Derzeit würden pro Iteration ' + ((this.storage.jobs.length * (this.storage.jobs.length - 1)) / 2) +
          ' Aufträge miteinander verglichen werden, wobei ungewiss ist, wie viele Iterationen ingesamt zur Lösungsfindung benötigt ' +
          'werden. Aus diesem Grund könnte die Problemlösung einige Zeit in Anspruch nehmen bzw. Ihre Ressourcen dafür nicht ausreichen.',
          'Es wird empfohlen, die Größe des Problems zu minimieren (weniger Aufträge). ' +
          'Möchten Sie dennoch das aktuelle Problem mithilfe einer lokalen Suche lösen?'
        ],
        DialogType.CONFIRM_WARNING
      )
        ;
    } else {
      return undefined;
    }
  }

  private getShiftingBottleneckWarningIfNeeded(): DialogContent | undefined {
    const faculty = (n: number) => {
      if (n <= 1) {
        return n;
      }
      return n * faculty(n - 1);
    };

    const currentMaxComplexity = faculty(this.storage.jobs.length) * ((this.storage.nrOfMachines * (this.storage.nrOfMachines + 1)) / 2);
    const recommendedMaxComplexity = 156920924160000; // faculty(15) * ((15 * (15 + 1)) / 2)

    if (currentMaxComplexity > recommendedMaxComplexity) {
      return new DialogContent(
        'Lösen des Reihenfolgeproblems bestätigen',
        [
          'Das aktuelle Problem ist zwar mithilfe der Shifting-Bottleneck-Heuristik lösbar, mit seinen ' + this.storage.jobs.length +
          ' Aufträgen und ' + this.storage.nrOfMachines + ' Maschinen allerdings recht komplex.',
          'Zwar handelt es sich beim gewählten Verfahren um eine Heuristik, allerdings werden zum Finden einer Lösung Hilfsprobleme ' +
          'mithilfe eines exakten Verfahrens (Branch and Bound) gelöst, sodass also im schlimmsten Falle alle ihrer ' +
          'Kombinationsmöglichkeiten geprüft werden. Aus diesem Grund könnte die Problemlösung einige Zeit in Anspruch nehmen bzw. Ihre ' +
          'Ressourcen dafür nicht ausreichen.',
          'Es wird empfohlen, die Größe des Problems zu minimieren (weniger Aufträge/weniger Maschinen). ' +
          'Möchten Sie dennoch das aktuelle Problem mithilfe der Shifting-Bottleneck-Heuristik lösen?'
        ],
        DialogType.CONFIRM_WARNING,
        [
          'Empfohlene maximale Menge an Schritten: ' + recommendedMaxComplexity + ' (entspricht 15 Aufträgen auf 15 Maschinen)',
          'Derzeitige maximale Menge an Schritten: ' + currentMaxComplexity
        ]
      )
        ;
    } else {
      return undefined;
    }
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
    this.objectiveFunction = this.storage.objectiveFunction;
    this.isLoggingConfigured = this.storage.isLoggingConfigured;
    if (this.isLoggingConfigured) {
      this.logging = [];
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

  // Static scheduling:

  private scheduleStatically(): void {
    this.logSchedulingProcedure(1, 'Bestimmen der maschinenübergreifenden Abarbeitungsreihenfolge', LogEventType.JOB_QUEUE);

    let bestPermutation: ScheduledJob[];
    if (this.heuristicType === HeuristicDefiner.NEH_HEURISTIC) {
      bestPermutation = this.bestPermutationNeh();
    } else if (this.heuristicType === HeuristicDefiner.LOCAL_SEARCH) {
      bestPermutation = this.bestPermutationLocalSearch();
    }

    this.logSchedulingProcedure(1, 'Maschinenübergreifende Abarbeitungsreihenfolge: ' +
      this.jobListStringForLogging(bestPermutation), LogEventType.JOB_QUEUE);

    // Run final solution once again in order to be able to generate diagrams later on:
    this.jobs = bestPermutation.map(job => new ScheduledJob(job));
    this.currentTimestampInScheduling = this.mockProductionOfPermutation(this.jobs, true);
  }

  private bestPermutationNeh(): ScheduledJob[] {
    const presortedJobs = this.preSortJobs();

    let bestPermutationYet: ScheduledJob[] = [presortedJobs[0]];
    let currentPermutations: ScheduledJob[][];

    // start index 1 as first permutation already contains 0:
    for (let i = 1; i < presortedJobs.length; i++) {
      currentPermutations = this.createPermutationsByAddingJob(bestPermutationYet, presortedJobs[i]);
      bestPermutationYet = this.getCurrentBestPermutation(currentPermutations);
    }

    return bestPermutationYet;
  }

  private preSortJobs(): ScheduledJob[] {
    this.logPreSortingBasedOnObjectiveFunction();

    const sortedJobs = this.jobs.sort((j1, j2) => {
      const valueA = this.getCompareValueForPresortingBasedOnObjectiveFunction(j1);
      const valueB = this.getCompareValueForPresortingBasedOnObjectiveFunction(j2);

      // Logging:
      if (valueA < valueB) {
        this.logSchedulingProcedure(1, 'Maschinenübergreifende Vorsortierung: Bevorzugen von '
          + this.jobStringForLogging(j1) + ' (Wert: ' + valueA + ') gegenüber ' + this.jobStringForLogging(j2) +
          ' (Wert: ' + valueB + ')', LogEventType.HEURISTIC_BASED_SORTING);
      } else if (valueB > valueA) {
        this.logSchedulingProcedure(1, 'Maschinenübergreifende Vorsortierung: Bevorzugen von ' +
          this.jobStringForLogging(j2) + ' (Wert: ' + valueB + ') gegenüber ' + this.jobStringForLogging(j1) +
          ' (Wert: ' + valueA + ')', LogEventType.HEURISTIC_BASED_SORTING);
      } else {
        this.logSchedulingProcedure(1, 'Maschinenübergreifende Vorsortierung: Betrachteter Wert für ' +
          this.jobStringForLogging(j1) + ' & ' + this.jobStringForLogging(j2) + ' identisch (' + valueA +
          '), daher keine Sortierung möglich', LogEventType.HEURISTIC_BASED_SORTING);
      }
      // End of logging

      return valueA - valueB;
    });

    this.logSchedulingProcedure(1, 'Vorsortieren der Aufträge abgeschlossen: ' +
      this.jobListStringForLogging(sortedJobs), LogEventType.HEURISTIC_BASED_SORTING);

    return sortedJobs;
  }

  private logPreSortingBasedOnObjectiveFunction(): void {
    let preSortBasedOn: string;

    if (this.objectiveFunction === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_DELAYED_WORK
      || this.objectiveFunction === ObjectiveFunction.MAX_DELAY) {
      preSortBasedOn = 'ihren gewünschten Fertigstellungsterminen';
    } else if (this.objectiveFunction === ObjectiveFunction.CYCLE_TIME
      || this.objectiveFunction === ObjectiveFunction.SUM_FINISHING_TIMESTAMPS) {
      preSortBasedOn = 'der Summe ihrer Bearbeitungszeiten';
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      preSortBasedOn = 'der gewichteten Summe ihrer Bearbeitungszeiten';
    } else if (this.objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      preSortBasedOn = 'ihren gewichteten gewünschten Fertigstellungsterminen';
    }

    this.logSchedulingProcedure(1, 'Maschinenübergreifendes Vorsortieren der Aufträge nach ' + preSortBasedOn,
      LogEventType.HEURISTIC_BASED_SORTING);
  }

  private bestPermutationLocalSearch(): ScheduledJob[] {
    let iteration = 0;
    let startValue: number;
    let bestPermutationYet = this.jobs;
    let currentBestValue = this.getCompareValueForPermutation(bestPermutationYet);
    this.localSearchBestValuesForIterations = [currentBestValue];

    do {
      iteration++;
      startValue = currentBestValue;
      const possiblePermutations: ScheduledJob[][] = this.createPermutationsBySwappingJobs(bestPermutationYet);
      possiblePermutations.forEach(permutation => {
        const comparisonValue = this.getCompareValueForPermutation(permutation);
        if (comparisonValue < currentBestValue) {
          currentBestValue = comparisonValue;
          bestPermutationYet = permutation;
        }
      });

      this.localSearchBestValuesForIterations.push(currentBestValue);
      // TODO content: Log local search
    } while (currentBestValue < startValue);

    return bestPermutationYet;
  }

  private getCompareValueForPresortingBasedOnObjectiveFunction(job: ScheduledJob): number {
    if (this.objectiveFunction === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_DELAYED_WORK
      || this.objectiveFunction === ObjectiveFunction.MAX_DELAY) {
      return job.dueDate;
    } else if (this.objectiveFunction === ObjectiveFunction.CYCLE_TIME
      || this.objectiveFunction === ObjectiveFunction.SUM_FINISHING_TIMESTAMPS) {
      return job.totalMachiningTime;
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      return job.totalMachiningTime / job.weight;
    } else if (this.objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      return job.dueDate / job.weight;
    }
  }

  private createPermutationsByAddingJob(existingPermutation: ScheduledJob[], newJob: ScheduledJob): ScheduledJob[][] {
    const permutations: ScheduledJob[][] = [];
    for (let i = 0; i <= existingPermutation.length; i++) {
      const copiedPermutation = existingPermutation.map(job => new ScheduledJob(job));
      copiedPermutation.splice(i, 0, newJob);
      permutations.push(copiedPermutation);
    }
    return permutations;
  }

  private createPermutationsBySwappingJobs(existingPermutation: ScheduledJob[]): ScheduledJob[][] {
    const permutations: ScheduledJob[][] = [];
    for (let i = 0; i < existingPermutation.length; i++) {
      for (let j = i + 1; j < existingPermutation.length; j++) {
        const copiedPermutation = existingPermutation.map(job => new ScheduledJob(job));
        [copiedPermutation [i], copiedPermutation[j]] = [copiedPermutation[j], copiedPermutation[i]];
        permutations.push(copiedPermutation);
      }
    }
    return permutations;
  }

  private getCurrentBestPermutation(permutations: ScheduledJob[][]): ScheduledJob[] {

    const permutationsAndValuesTuple = permutations.map(permutation => {
      const value = this.getCompareValueForPermutation(permutation);
      this.logSchedulingProcedure(1, 'Ermitteln des zu minimierenden Zielwerts bei Abarbeitung von Permutation ' +
        this.jobListStringForLogging(permutation) + ' mit dem Ergebnis: ' + value, LogEventType.HEURISTIC_BASED_SORTING);
      return [permutation, value];
    });

    const minValue = Math.min.apply(Math, permutationsAndValuesTuple.map(paw => paw[1]));
    const bestPermutation = <ScheduledJob[]>permutationsAndValuesTuple.find(permutation => permutation[1] === minValue)[0];

    this.logSchedulingProcedure(1, 'Kleinster zu minimierender Zielwert ist ' + minValue + ' und somit maschinenübergreifend weiter ' +
      'betrachtete Permutation: ' + this.jobListStringForLogging(bestPermutation), LogEventType.HEURISTIC_BASED_SORTING);

    return bestPermutation;
  }

  private getCompareValueForPermutation(permutation: ScheduledJob[]): number {
    permutation = permutation.map(job => new ScheduledJob(job));
    const duration = this.mockProductionOfPermutation(permutation) - 1;

    if (this.objectiveFunction === ObjectiveFunction.CYCLE_TIME) {
      return duration;
    } else if (this.objectiveFunction === ObjectiveFunction.MAX_DELAY) {
      return Math.max.apply(Math, permutation.map(job => job.finishedAtTimestamp - job.dueDate));
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES) {
      return permutation.map(job => job.delay).reduce((d1, d2) => d1 + d2, 0);
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_FINISHING_TIMESTAMPS) {
      return permutation.map(job => job.finishedAtTimestamp).reduce((f1, f2) => f1 + f2, 0);
    } else if (this.objectiveFunction === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES) {
      return permutation.filter(job => job.delay).length;
    } else if (this.objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES) {
      return permutation.filter(job => job.delay).map(job => job.weight).reduce((wd1, wd2) => wd1 + wd2, 0);
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      return permutation.map(job => job.finishedAtTimestamp * job.weight).reduce((wf1, wf2) => wf1 + wf2, 0);
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      return permutation.map(job => job.delay * job.weight).reduce((wd1, wd2) => wd1 + wd2, 0);
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_DELAYED_WORK) {
      return permutation.filter(job => job.delay)
        .map(job => job.operationsOnMachines
          .filter(operation => operation.finishTimestamp > job.dueDate)
          .map(o => o.finishTimestamp - (o.startTimestamp > job.dueDate ? o.startTimestamp : job.dueDate))
          .reduce((t1, t2) => t1 + t2, 0))
        .reduce((st1, st2) => st1 + st2, 0);
    } else if (this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK) {
      return permutation.filter(job => job.delay)
        .map(job => job.weight * job.operationsOnMachines
          .filter(operation => operation.finishTimestamp > job.dueDate)
          .map(o => o.finishTimestamp - (o.startTimestamp > job.dueDate ? o.startTimestamp : job.dueDate))
          .reduce((wt1, wt2) => wt1 + wt2))
        .reduce((wst1, wst2) => wst1 + wst2, 0);
    }
  }

  private mockProductionOfPermutation(permutation: ScheduledJob[], isLog?: boolean): number {
    let mockTimestamp = 0;

    do {
      this.handleEachCurrentJobOfMachine(mockTimestamp);
      this.addJobsToMachineQueues(permutation);

      this.machines
        .filter(machine => !machine.currentJob && machine.jobQueue.length)
        .forEach(machine => {
          machine.startProductionOfNext(mockTimestamp);
          if (isLog) {
            this.logSchedulingProcedure(machine.machineNr, 'Beginn der Abarbeitung von Auftrag ' +
              this.jobStringForLogging(machine.currentJob), LogEventType.PRODUCTION_START, mockTimestamp);
          }
        });

      mockTimestamp++;
    } while (permutation.some(job => job.nextMachineNr !== undefined));

    return mockTimestamp;
  }

  // Dynamic scheduling:

  private proceedDynamicScheduling(): void {
    this.handleEachCurrentJobOfMachine();
    this.addJobsToMachineQueues();

    // Sort queues of free machines (with jobs in queue) and produce best job:
    this.machines
      .filter(machine => !machine.currentJob && machine.jobQueue.length)
      .forEach(machine => {

          // No sorting for each timestamp in NN-Heuristic (only once before setting up)
          if (this.heuristicType !== HeuristicDefiner.NEAREST_NEIGHBOUR ||
            !machine.lastJob || machine.lastJob.finishedAtTimestamp === this.currentTimestampInScheduling) {

            this.logSchedulingProcedure(machine.machineNr, 'Beginn der Sortierung der Warteschlange', LogEventType.HEURISTIC_BASED_SORTING);
            machine.jobQueue.sort((jobA: ScheduledJob, jobB: ScheduledJob) =>
              this.dynamicComparisonResultForCurrentHeuristic(jobA, jobB, machine.machineNr)
            );
            this.logSchedulingProcedure(machine.machineNr, 'Fertig bestimmte Warteschlange: ' +
              this.jobListStringForLogging(machine.jobQueue), LogEventType.JOB_QUEUE);
          }

          // No current job could be possible here because of setup times
          if (this.heuristicType !== HeuristicDefiner.NEAREST_NEIGHBOUR || machine.isMachineSetup(this.currentTimestampInScheduling)) {

            machine.startProductionOfNext(this.currentTimestampInScheduling);

            this.logSchedulingProcedure(machine.machineNr,
              'Beginn der Abarbeitung von Auftrag ' + this.jobStringForLogging(machine.currentJob), LogEventType.PRODUCTION_START);
          } else {
            this.logSchedulingProcedure(machine.machineNr,
              'Rüsten für Auftrag ' + this.jobStringForLogging(machine.jobQueue[0]), LogEventType.PRODUCTION_START);
          }
        }
      );
  }

  // Called for any executed heuristic (for dynamic heuristics: before calling the heuristic based sorting)
  private handleEachCurrentJobOfMachine(mockTimestamp?: number): void {
    // mock timestamp used for static procedures only
    const usedTimestamp = mockTimestamp === undefined ? this.currentTimestampInScheduling : mockTimestamp;
    this.machines
      .filter(machine => machine.currentJob)
      .forEach(machine => machine.freeIfCurrentJobOperationFinished(usedTimestamp));
  }

  // Called for any dynamically executed heuristic (before calling the heuristic based sorting) and static procedure mocking
  private addJobsToMachineQueues(givenJobs?: ScheduledJob[]): void {
    // Given jobs used for static procedures only
    const jobs = givenJobs ? givenJobs : this.jobs;

    jobs.filter(job =>
      job.nextMachineNr !== undefined // Exclude jobs that are already finished
      && !this.machines.some(m => m.currentJob === job) // exclude jobs that are currently in production
    ).forEach(job => {
      const nextMachine = this.machines.find(m => m.machineNr === job.nextMachineNr);
      if (!nextMachine.jobQueue.includes(job)) { // only add jobs, that have not been pushed to queue already
        nextMachine.jobQueue.push(job);

        // In case of dynamic scheduling:
        if (!givenJobs) {
          this.logSchedulingProcedure(nextMachine.machineNr, 'Hinzufügen zur Warteschlange von '
            + this.jobStringForLogging(job), LogEventType.JOB_QUEUE);
        }
      }
    });
  }

  // Implementation of sorting based on heuristics starts here (for dynamically executed heuristics):
  private dynamicComparisonResultForCurrentHeuristic(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number): number {
    if (this.heuristicType === HeuristicDefiner.PRIORITY_RULES) {
      return this.compareJobsByPriorityRules(jobA, jobB, machineNr);
    } else if (this.heuristicType === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      return this.compareJobsBySetupTimes(jobA, jobB, machineNr);
    }
  }

  private compareJobsByPriorityRules(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number): number {
    for (const priorityRule of this.priorityRules) {
      if (priorityRule === PriorityRule.FCFS) {
        this.logSchedulingProcedure(machineNr, PriorityRule.FCFS + ' angewandt auf ' + this.jobStringForLogging(jobA) + ' & ' +
          this.jobStringForLogging(jobB), LogEventType.HEURISTIC_BASED_SORTING);
        return 0;
      } else {
        const aPriorityValue = this.getPriorityValueForJob(jobA, priorityRule);
        const bPriorityValue = this.getPriorityValueForJob(jobB, priorityRule);

        if (aPriorityValue < bPriorityValue) {
          this.logSchedulingProcedure(machineNr, 'Bevorzugen von ' + this.jobStringForLogging(jobA) + ' (betrachteter Wert: '
            + aPriorityValue + ') gegenüber ' + this.jobStringForLogging(jobB) + ' (betrachteter Wert: ' + bPriorityValue
            + ') aufgrund von Prioritätsregel: ' + priorityRule, LogEventType.HEURISTIC_BASED_SORTING);
          return -1;
        } else if (bPriorityValue < aPriorityValue) {
          this.logSchedulingProcedure(machineNr, 'Bevorzugen von ' + this.jobStringForLogging(jobB) + ' (betrachteter Wert: '
            + bPriorityValue + ') gegenüber ' + this.jobStringForLogging(jobA) + ' (betrachteter Wert: ' + aPriorityValue
            + ') aufgrund von Prioritätsregel: ' + priorityRule, LogEventType.HEURISTIC_BASED_SORTING);
          return 1;
        } else {
          this.logSchedulingProcedure(machineNr,
            'Betrachteter Wert für ' + this.jobStringForLogging(jobA) + ' & ' + this.jobStringForLogging(jobB) + ' identisch (' +
            aPriorityValue + '), daher keine Sortierung mithilfe von Prioritätsregel ' + priorityRule + ' möglich',
            LogEventType.HEURISTIC_BASED_SORTING);
          // No return value since in case of no clear result, the next priority rule is to be taken.
          // Returning 0 does only make sense if no more rules are available or for FCFS

        }
      }
    }
    this.logSchedulingProcedure(machineNr,
      this.jobStringForLogging(jobA) + ' & ' + this.jobStringForLogging(jobB) + ' bezüglich aller betrachteten Prioritätsregeln ' +
      'identisch und somit nicht vergleichbar (Sortierung entspricht nun ' + PriorityRule.FCFS + ')', LogEventType.HEURISTIC_BASED_SORTING);
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

  private compareJobsBySetupTimes(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number) {

    const previousJob = this.machines.find(machine => machine.machineNr === machineNr).lastJob;

    // if previous job: time from previous job to a/b, if not: find minimum setup time from a/b to any job
    const lowestValueOfA = previousJob ? previousJob.setupTimesToOtherJobs.find(sT => sT.idTo === jobA.id).duration
      : Math.min.apply(Math, jobA.setupTimesToOtherJobs.map(sT => sT.duration));
    const lowestValueOfB = previousJob ? previousJob.setupTimesToOtherJobs.find(sT => sT.idTo === jobB.id).duration
      : Math.min.apply(Math, jobB.setupTimesToOtherJobs.map(sT => sT.duration));

    // Logging only:
    if (lowestValueOfA < lowestValueOfB) {
      this.logSchedulingProcedure(machineNr, 'Bevorzugen von ' + this.jobStringForLogging(jobA) + ' gegenüber '
        + this.jobStringForLogging(jobB) + ' als ' + (previousJob ?
            // if previous job:
            'folgender Auftrag, da die Rüstzeit vom vorherigen Auftrag (' + this.jobStringForLogging(previousJob)
            + ') zum genannten Auftrag geringer ist (' + lowestValueOfA + ' gegenüber ' + lowestValueOfB + ')' :
            // if no previous job:
            'Startwert, da seine kürzeste Rüstzeit zu einem folgenden Auftrag (' + lowestValueOfA +
            ') kleiner ist als die vom letzteren Auftrag zu einem folgenden (' + lowestValueOfB + ')'
        ), LogEventType.HEURISTIC_BASED_SORTING);
    } else if (lowestValueOfB < lowestValueOfA) {
      this.logSchedulingProcedure(machineNr, 'Bevorzugen von ' + this.jobStringForLogging(jobB) + ' gegenüber '
        + this.jobStringForLogging(jobA) + ' als ' + (previousJob ?
            // if previous job:
            'folgender Auftrag, da die Rüstzeit vom vorherigen Auftrag (' + this.jobStringForLogging(previousJob)
            + ') zum genannten Auftrag geringer ist (' + lowestValueOfB + ' gegenüber ' + lowestValueOfA + ')' :
            // if no previous job:
            'Startwert, da seine kürzeste Rüstzeit zu einem folgenden Auftrag (' + lowestValueOfB +
            ') kleiner ist als die vom letzteren Auftrag zu einem folgenden (' + lowestValueOfA + ')'
        ), LogEventType.HEURISTIC_BASED_SORTING);
    } else {
      this.logSchedulingProcedure(machineNr, (previousJob ?
          // if previous job:
          'Rüstzeit zu Auftrag ' + this.jobStringForLogging(jobA) + ' & zu Auftrag ' + this.jobStringForLogging(jobB) +
          ' ausgehend von vorherigem Auftrag (' + this.jobStringForLogging(previousJob) + ') identisch (' + lowestValueOfA +
          '), daher keine Aussage darüber möglich, welcher der geeignetere Nachfolger ist' :
          // if no previous job:
          'Kleinste Rüstzeit zu einem folgenden Auftrag für ' + this.jobStringForLogging(jobA) + ' & ' +
          this.jobStringForLogging(jobB) + ' identisch (' + lowestValueOfA + '), daher keine Aussage darüber möglich, welcher ' +
          'dieser beiden Auftäge besser als Startwert geeignet wäre'
        ), LogEventType.HEURISTIC_BASED_SORTING
      );
    }
    // End of logging

    return lowestValueOfA - lowestValueOfB;
  }

  private scheduleByShiftingBottleneckHeuristic(): void {

    // TODO content: Log process
    let lowerBoundMakespan = Math.max.apply(Math, this.jobs.map(job => job.totalMachiningTime));

    const schedulingIgnoringMachineCapacity = this.getSchedulingIgnoringMachineCapacity(lowerBoundMakespan);
    const isOptimalSolution = !schedulingIgnoringMachineCapacity
      .filter(machine => machine.some(jobsAtTimestamp => jobsAtTimestamp.length > 1));

    if (!isOptimalSolution) {
      // TODO content: Log that best solution has not been found

      const finalOneMachineSchedules: SchedulingPlanForMachine[] = [];
      let remainingOneMachineSchedules = this.initializeOneMachineSchedules(lowerBoundMakespan);
      const bottleneckRelations = this.initializeBottleneckRelations();
      const invertedBottleneckRelations = this.initializeInvertedBottleneckRelations();

      while (finalOneMachineSchedules.length < this.machines.length) {
        const highestLmaxAfterBbSchedule = this.getScheduleWithHighestOptimalLmax(remainingOneMachineSchedules);
        lowerBoundMakespan += this.getMaxLatenessForSortedOneMachineJobs(highestLmaxAfterBbSchedule.scheduledJobs);
        finalOneMachineSchedules.push(highestLmaxAfterBbSchedule);
        remainingOneMachineSchedules = remainingOneMachineSchedules.filter(schedule => schedule !== highestLmaxAfterBbSchedule);
        this.updateUnscheduledRelations(
          remainingOneMachineSchedules, highestLmaxAfterBbSchedule, invertedBottleneckRelations, bottleneckRelations, lowerBoundMakespan);
      }
      this.startProductionWithGivenOneMachineSchedules(finalOneMachineSchedules);
    } else {
      // TODO content: Log that best solution is found!
      this.currentTimestampInScheduling = this.mockProductionOfPermutation(this.jobs, true);
    }
  }

  private initializeOneMachineSchedules(lowerBoundMakespan: number): SchedulingPlanForMachine[] {
    return this.machines
      .map(machine => new SchedulingPlanForMachine(machine.machineNr,
        this.jobs
          .map(job => new RelaxableOneMachineScheduledJob(job, machine.machineNr, lowerBoundMakespan)
          )
        )
      );
  }

  private initializeBottleneckRelations(): BottleneckRelation[] {
    const relations: BottleneckRelation[] = [];
    this.jobs.forEach(job => {
      // More than one has to be given, since this method is only called in Jobshop problems
      const ownRelations: BottleneckRelation[] = [];
      for (let i = job.machineTimes.length - 1; i >= 0; i--) {
        const relation = new BottleneckRelation();
        relation.jobId = job.id;
        relation.machineNr = job.machineTimes[i].machineNr;
        if (i < job.machineTimes.length - 1) {
          relation.nextElements = [ownRelations[ownRelations.length - 1]];
        }
        ownRelations.push(relation);
      }
      relations.push(...ownRelations);
    });
    return relations;
  }

  private initializeInvertedBottleneckRelations(): BottleneckRelation[] {
    const relations: BottleneckRelation[] = [];
    this.jobs.forEach(job => {
      // More than one has to be given, since this method is only called in Jobshop problems
      const ownRelations: BottleneckRelation[] = [];
      for (let i = 0; i < job.machineTimes.length; i++) {
        const relation = new BottleneckRelation();
        relation.jobId = job.id;
        relation.machineNr = job.machineTimes[i].machineNr;
        if (i > 0) {
          relation.nextElements = [ownRelations[ownRelations.length - 1]];
        }
        ownRelations.push(relation);
      }
      relations.push(...ownRelations);
    });
    return relations;
  }

  private updateUnscheduledRelations(schedulesToUpdate: SchedulingPlanForMachine[],
                                     finalSchedule: SchedulingPlanForMachine,
                                     invertedBottleneckRelations: BottleneckRelation[],
                                     bottleneckRelations: BottleneckRelation[],
                                     lmax: number): void {

    this.updateRelationTables(invertedBottleneckRelations, bottleneckRelations, finalSchedule);

    // TODO content: Log new relations/values for p, r, d?
    schedulesToUpdate.forEach(schedule =>
      schedule.scheduledJobs.forEach(job => {
        const longestPastBranch = this.getLongestTimeForPathStarting(job.id, schedule.machineNr, invertedBottleneckRelations);
        const longestFutureBranch = this.getLongestTimeForPathStarting(job.id, schedule.machineNr, bottleneckRelations);
        job.onMachineAvailability = longestPastBranch;
        job.onMachineDueDate = lmax - longestFutureBranch;
      })
    );
  }

  private updateRelationTables(invertedBottleneckRelations: BottleneckRelation[],
                               bottleneckRelations: BottleneckRelation[],
                               finalSchedule: SchedulingPlanForMachine): void {

    for (let i = 0; i < finalSchedule.scheduledJobs.length - 1; i++) {
      const currentJobId = finalSchedule.scheduledJobs[i].id;
      const nextJobId = finalSchedule.scheduledJobs[i + 1].id;

      const currentNode = bottleneckRelations
        .find(relation => relation.machineNr === finalSchedule.machineNr && relation.jobId === currentJobId);
      const nextNode = bottleneckRelations
        .find(relation => relation.machineNr === finalSchedule.machineNr && relation.jobId === nextJobId);
      if (!currentNode.nextElements) {
        currentNode.nextElements = [nextNode];
      } else {
        currentNode.nextElements.push(nextNode);
      }

      const invertedCurrentNode = invertedBottleneckRelations
        .find(relation => relation.machineNr === finalSchedule.machineNr && relation.jobId === nextJobId);
      const invertedNextNode = invertedBottleneckRelations
        .find(relation => relation.machineNr === finalSchedule.machineNr && relation.jobId === currentJobId);

      if (!invertedCurrentNode.nextElements) {
        invertedCurrentNode.nextElements = [invertedNextNode];
      } else {
        invertedCurrentNode.nextElements.push(invertedNextNode);
      }
    }

  }

  private getLongestTimeForPathStarting(jobId: number, machineNr: number,
                                        bottleneckRelations: BottleneckRelation[]): number {
    let longestTimeYet = 0;
    const findAllPaths = (startRelation: BottleneckRelation, previousTime?: number) => {

      const currentTime = previousTime !== undefined ? previousTime + this.jobs
        .find(job => job.id === startRelation.jobId).machineTimes
        .find(mt => mt.machineNr === startRelation.machineNr).timeOnMachine : 0;
      if (currentTime > longestTimeYet) {
        longestTimeYet = currentTime;
      }
      if (startRelation.nextElements) {
        startRelation.nextElements.forEach(next => findAllPaths(next, currentTime));
      }
    };

    const start = bottleneckRelations.find(relation => relation.machineNr === machineNr && relation.jobId === jobId);
    findAllPaths(start);
    return longestTimeYet;
  }

  private getSchedulingIgnoringMachineCapacity(maxTime: number): ScheduledJob[][][] {
    const schedulingIgnoringMachineCapacity = this.machines.map(() => new Array(maxTime));
    this.jobs.forEach(job => {
      let countedTime = 0;
      job.machineTimes.forEach(mt => {
        for (let i = countedTime; i < mt.timeOnMachine + countedTime; i++) {
          if (!schedulingIgnoringMachineCapacity[mt.machineNr - 1][i]) {
            schedulingIgnoringMachineCapacity[mt.machineNr - 1][i] = [];
          }
          schedulingIgnoringMachineCapacity[mt.machineNr - 1][i].push(job);
        }
        countedTime += mt.timeOnMachine;
      });
    });
    return schedulingIgnoringMachineCapacity;
  }

  private getScheduleWithHighestOptimalLmax(schedulingPlans: SchedulingPlanForMachine[]): SchedulingPlanForMachine {
    // No .reduce() in order to return first optimum and not last (as in literature).
    schedulingPlans.forEach(schedule => {
      schedule.scheduledJobs = this.getBestPermutationByBranchAndBound(schedule.scheduledJobs);

      // TODO internal: For testing only, remove both code and curly brackets after final implementation: Or log?
      console.log(schedule.machineNr + '. Maschine, Lmax: ' + this.getMaxLatenessForSortedOneMachineJobs(schedule.scheduledJobs) + ' f.: '
        + schedule.scheduledJobs.map(j => j.id).join('->'));

    });
    return schedulingPlans.find(schedule => this.getMaxLatenessForSortedOneMachineJobs(schedule.scheduledJobs) ===
      Math.max.apply(Math, schedulingPlans.map(_schedule => this.getMaxLatenessForSortedOneMachineJobs(_schedule.scheduledJobs))));
  }

  private startProductionWithGivenOneMachineSchedules(finalOneMachineSchedules: SchedulingPlanForMachine[]): void {
    let schedulingTimestamp = 0;

    do {
      this.handleEachCurrentJobOfMachine(schedulingTimestamp);
      this.machines.forEach(machine => {
        const optimizedSchedule = finalOneMachineSchedules.find(schedule => schedule.machineNr === machine.machineNr);

        if (optimizedSchedule.scheduledJobs.length) {
          const nextJobForMachine = this.jobs.find(job => job.id === optimizedSchedule.scheduledJobs[0].id);

          // If each operation of the next job before the operation on this machine is finished:
          if (nextJobForMachine.nextMachineNr === machine.machineNr) {
            machine.jobQueue.push(this.jobs.find(job => job.id === nextJobForMachine.id));
            optimizedSchedule.scheduledJobs.shift();
          }
        }
      });

      this.machines
        .filter(machine => !machine.currentJob && machine.jobQueue.length)
        .forEach(machine => {
          machine.startProductionOfNext(schedulingTimestamp);
          this.logSchedulingProcedure(machine.machineNr, 'Beginn der Abarbeitung von Auftrag ' +
            this.jobStringForLogging(machine.currentJob), LogEventType.PRODUCTION_START, schedulingTimestamp);
        });
      schedulingTimestamp++;
    } while (this.jobs.some(job => job.nextMachineNr !== undefined));
    this.currentTimestampInScheduling = schedulingTimestamp;
  }

  private getBestPermutationByBranchAndBound(jobs: RelaxableOneMachineScheduledJob[]): RelaxableOneMachineScheduledJob[] {
    // Sort jobs:
    let currentBestSolution: RelaxableOneMachineScheduledJob[] = jobs.sort((j1, j2) => j1.onMachineAvailability - j2.onMachineAvailability);
    let upperBound: number = this.getMaxLatenessForSortedOneMachineJobs(jobs);
    const totalLowerBound: number = this.getMaxLatenessForRelaxedOneMachineJobs(jobs);

    const proceedOnBranch = (branch: number[], _lowerBound: number) => {
      if (branch.length < jobs.length) {
        const lowerBoundAndProductionList = this.getMaxLatenessForPartlyFixedRelaxedJobs(jobs, branch);
        const currentBranchLowerBound = lowerBoundAndProductionList[0];

        if (currentBranchLowerBound < upperBound) {

          // TODO content: Log all proceeding jobs? if so: this line
          // console.log('proceed: ' + branch.join('->'));

          // if both the lower bound is smaller than the current upper bound and all jobs are produced without pausing:
          if (currentBranchLowerBound < upperBound && lowerBoundAndProductionList[1]) {
            currentBestSolution = lowerBoundAndProductionList[1];
            upperBound = currentBranchLowerBound;
          }

          // If the current branch's lower bound did not match the given lower bound yet
          if (currentBranchLowerBound > _lowerBound || !lowerBoundAndProductionList[1]) {
            let isCurrentBestSolutionFound = false;
            currentBestSolution
              .filter(job => !branch.includes(job.id))
              .forEach(job => {
                if (!isCurrentBestSolutionFound) {
                  const newBranch = branch.slice(0);
                  newBranch.push(job.id);
                  isCurrentBestSolutionFound = proceedOnBranch(newBranch, currentBranchLowerBound);
                }
              });
          } else {
            // if the given lower bound is matched (-> no better solution). Because of this value, the branch will be stopped
            return true;
          }
        }
      }
    };

    currentBestSolution.map(job => job.id).forEach(id => proceedOnBranch([id], totalLowerBound));

    return currentBestSolution;
  }

  private getMaxLatenessForSortedOneMachineJobs(jobs: RelaxableOneMachineScheduledJob[]): number {

    let currentTimestamp = 0;
    let finishedJobs = 0;
    let currentMaxDelay: number;

    do {
      const currentJob = jobs[finishedJobs];

      if (currentTimestamp < currentJob.onMachineAvailability) {
        currentTimestamp = currentJob.onMachineAvailability + currentJob.onMachineOperationTime;
      } else {
        currentTimestamp += currentJob.onMachineOperationTime;
      }

      const delay = currentTimestamp - currentJob.onMachineDueDate;
      if (currentMaxDelay === undefined || currentMaxDelay < delay) {
        currentMaxDelay = delay;
      }

      finishedJobs++;
    } while (finishedJobs < jobs.length);

    return currentMaxDelay;
  }

  private getMaxLatenessForRelaxedOneMachineJobs(jobs: RelaxableOneMachineScheduledJob[]): number {
    jobs.forEach(job => job.initializeRelaxedProduction());
    let currentTimestamp = 0;

    do {
      const currentJob = jobs
        .filter(job => !job.isRelaxedProductionFinished
          && job.onMachineAvailability <= currentTimestamp)
        .sort((j1, j2) => j1.onMachineDueDate - j2.onMachineDueDate)[0];
      // Might be undefined if no job is available yet
      if (currentJob) {
        currentJob.proceedProducing(currentTimestamp);
      }
      currentTimestamp++;
    } while (jobs.some(job => !job.isRelaxedProductionFinished));

    return Math.max.apply(Math, jobs.map(job => job.onMachineDelay));
  }

  private getMaxLatenessForPartlyFixedRelaxedJobs(jobs: RelaxableOneMachineScheduledJob[], fixtures: number[])
    : [number, RelaxableOneMachineScheduledJob[]] {

    const productionLine: RelaxableOneMachineScheduledJob[] = [];
    let currentTimestamp = 0;
    let maxDelayOfFixedJobs: number;

    jobs.forEach(job => job.initializeRelaxedProduction());
    fixtures.forEach(fixedId => {
      const currentJob = jobs.find(job => job.id === fixedId);
      if (currentTimestamp < currentJob.onMachineAvailability) {
        currentTimestamp = currentJob.onMachineAvailability + currentJob.onMachineOperationTime;
      } else {
        currentTimestamp += currentJob.onMachineOperationTime;
      }
      const delay = currentTimestamp - currentJob.onMachineDueDate;
      if (maxDelayOfFixedJobs === undefined || maxDelayOfFixedJobs < delay) {
        maxDelayOfFixedJobs = delay;
      }
      productionLine.push(currentJob);
    });

    do {
      let currentJob = jobs
        .filter(job => !job.isRelaxedProductionFinished
          && job.onMachineAvailability <= currentTimestamp
          && !fixtures.includes(job.id))
        .sort((j1, j2) => j1.onMachineDueDate - j2.onMachineDueDate)[0];

      // Might be undefined if no job is available yet
      if (currentJob) {
        // Check if previously produced job can be taken again
        const previousJob = productionLine[productionLine.length - 1];
        if (productionLine.length > fixtures.length
          && !previousJob.isRelaxedProductionFinished
          && previousJob.onMachineDueDate === currentJob.onMachineDueDate) {
          currentJob = previousJob;
        } else {
          productionLine.push(currentJob);
        }
        currentJob.proceedProducing(currentTimestamp);
      }

      currentTimestamp++;
    } while (jobs.some(job => !fixtures.includes(job.id) && !job.isRelaxedProductionFinished));

    const nonFixedMaxDelay = Math.max.apply(Math, jobs.filter(job => !fixtures.includes(job.id)).map(job => job.onMachineDelay));
    const totalMax = Math.max.apply(Math, [nonFixedMaxDelay, maxDelayOfFixedJobs]);

    return [totalMax, productionLine.length === jobs.length ? productionLine : undefined];
  }

  // called after successful scheduling
  private generateSchedulingResult(): SchedulingResult {
    const result = new SchedulingResult();
    result.generalData = this.generateGeneralSchedulingData();
    result.schedulingTimesData = this.generateSchedulingTimesData();
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
    data.priorityRules = this.priorityRules; // may be undefined

    if (this.heuristicType === HeuristicDefiner.LOCAL_SEARCH) {
      const iterationsKpi = new Kpi();
      iterationsKpi.kpi = this.localSearchBestValuesForIterations.length;
      iterationsKpi.iconClasses = ['fas', 'fa-redo'];
      iterationsKpi.title = 'Iterationen bis zur Lösungsfindung';
      data.iterations = iterationsKpi;
    }

    return data;
  }

  private generateSchedulingTimesData(): SchedulingTimesData {
    const data = new SchedulingTimesData();
    data.allMachineOperationsTimeline = this.generateAllMachineOperationsTimeline();
    data.machineTables = this.generateAllMachineTables();
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

  private generateAllMachineTables(): MachineTableData[] {
    const data = [];

    for (let i = 1; i <= this.machines.length; i++) {
      const machineData = new MachineTableData();
      machineData.machineNr = i;
      machineData.machineTableEntries = [];
      data.push(machineData);
    }

    this.jobs.forEach(job => {
      job.operationsOnMachines
        .forEach(operation => {
          const entry = new MachineTableEntry();
          entry.producedJobString = job.name + ' (ID: ' + job.id + ')';
          entry.timestampStart = operation.startTimestamp;
          entry.timestampEnd = operation.finishTimestamp;
          (<MachineTableData>data[operation.machineNr - 1]).machineTableEntries.push(entry);
        });
    });

    data.forEach(table => table.machineTableEntries.sort((o1, o2) => o1.timestampStart - o2.timestampStart));

    const colorMap = this.generateColorMapForMachineTables(data[0].machineTableEntries.map(entry => entry.producedJobString));
    data.forEach(table => table.machineTableEntries.forEach(entry => entry.color = colorMap.get(entry.producedJobString)));

    return data;
  }

  private generateColorMapForMachineTables(sortedFirstMachineJobStings: string[]): Map<string, string> {
    const colorMap: Map<string, string> = new Map();
    const colors = this.generateUniqueJobColorValues().map(rgb => 'rgb(' + rgb + ')');
    for (let i = 0; i < sortedFirstMachineJobStings.length; i++) {
      colorMap.set(sortedFirstMachineJobStings[i], colors[i]);
    }
    return colorMap;
  }

  private generateVisualizableGeneralData(): VisualizableGeneralData {
    const data = new VisualizableGeneralData();
    data.totalDurationsOnMachines = this.generateTotalDurationsOnMachinesVisualization();
    data.totalJobTimes = this.generateTotalJobTimesVisualization();

    if (this.objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      data.jobWeightings = this.generateJobWeightingsVisualization();
    }

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
    const isMindDueDates = this.storage.getValueDefinitionStatus(DefinableValue.BETA_DUE_DATES) === DefinitionStatus.COMPLETELY_DEFINED;

    const sortedJobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    const dataset = new Dataset();
    dataset.data = sortedJobs
      .map(job => job.machineTimes
        .map(m => m.timeOnMachine)
        .reduce((m1, m2) => m1 + m2));
    dataset.label = 'Gesamtbearbeitungsdauer';

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.colors = this.getColorsAsSpecifiedInGanttFirstMachine().map(color => 'rgba(' + color + ',0.8)');
    visualization.title = 'Gesamtbearbeitungsdauer ' + (isMindDueDates ? 'und gewünschte Fertigstellungstermine ' : '') + 'aller Aufträge';
    visualization.labels = sortedJobs.map(job => job.name + ' (ID: ' + job.id + ')');
    visualization.datasets = [dataset];
    visualization.xLabel = 'Aufträge';
    visualization.yLabel = 'Zeiteinheiten';

    if (isMindDueDates) {
      const dueDatesDataset = new Dataset();
      dueDatesDataset.data = sortedJobs.map(job => job.dueDate);
      dueDatesDataset.label = 'Gewünschter Fertigstellungstermin';
      visualization.datasets.push(dueDatesDataset);
    }

    return visualization;
  }

  private generateJobWeightingsVisualization(): ChartData {
    const sortedJobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    const dataset = new Dataset();
    dataset.data = sortedJobs.map(job => job.weight);
    dataset.label = 'Gewichtung';

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.colors = this.getColorsAsSpecifiedInGanttFirstMachine().map(color => 'rgba(' + color + ',0.8)');
    visualization.title = 'Auftragsgewichtungen';
    visualization.labels = sortedJobs.map(job => job.name + ' (ID: ' + job.id + ')');
    visualization.datasets = [dataset];
    visualization.xLabel = 'Aufträge';
    visualization.yLabel = 'Gewichtungswert';

    return visualization;
  }

  private generateSolutionQualityData(): Kpi[] {
    const data = [];

    data.push(this.calculateTotalDurationKpi());
    data.push(this.calculateMeanCycleTimeKpi());
    data.push(this.calculateMeanJobBacklogKpi());

    // Either none or all jobs must have a due date
    if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_DUE_DATES) === DefinitionStatus.COMPLETELY_DEFINED) {
      data.push(this.calculateMeanDelayKpi());
      data.push(this.calculateStandardDeviationOfDelayKpi());
      data.push(this.calculateSumOfDelaysKpi());
      data.push(this.calculateMaximumDelayKpi());
    }

    if (this.heuristicType === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      data.push(this.calculateMeanSetupTimeKpi());
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

  private calculateMeanSetupTimeKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-cogs'];
    kpi.title = 'Mittlere Rüstzeit';

    const totalSetupTime = this.currentTimestampInScheduling - 1 -
      this.jobs
      // since only one machine is configured
        .map(job => job.machineTimes[0].timeOnMachine)
        .reduce((mt1, mt2) => mt1 + mt2);
    kpi.kpi = totalSetupTime / (this.jobs.length - 1); // since all jobs except for first can have setup times
    return kpi;
  }

  private generateVisualizableSolutionQualityData(): VisualizableSolutionQualityData {
    const data = new VisualizableSolutionQualityData();

    data.finishedJobsAtTimestamp = this.generateFinishedJobsAtTimestampVisualization();

    if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_DUE_DATES) === DefinitionStatus.COMPLETELY_DEFINED) {
      data.comparisonFinishTimestampAndDueDate = this.generateComparisonFinishTimestampAndDueDate();
      data.cumulatedDelaysAtTimestamps = this.generateCumulatedDelaysVisualization();
      data.comparisonDelayedAndInTimeJobs = this.generateComparisonDelayedAndInTimeVisualization();
    }

    // Specific diagrams:
    if (this.heuristicType === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      data.cumulatedSetupTimesAtTimetamps = this.generateCumulatedSetupTimesVisualization();
      data.comparisonMeanSetupTimes = this.generateComparisonMeanSetupTimesVisualization();
      data.comparisonSelectedAndMeanSetupTime = this.generateComparisonSelectedAndMeanSetupTimeVisualization();
    } else if (this.heuristicType === HeuristicDefiner.LOCAL_SEARCH) {
      data.valueToMinimizeAtIterations = this.generateValueToMinimizeAtIterations();
    }

    return data;
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

  private generateComparisonFinishTimestampAndDueDate(): ChartData {
    const sortedJobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    const dataset1 = new Dataset();
    dataset1.data = sortedJobs.map(job => job.finishedAtTimestamp);
    dataset1.label = 'Ist-Fertigstellungstermin';

    const dataset2 = new Dataset();
    dataset2.data = sortedJobs.map(job => job.dueDate);
    dataset2.label = 'Soll-Fertigstellungstermin';

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.colors = this.getColorsAsSpecifiedInGanttFirstMachine().map(color => 'rgba(' + color + ',0.8)');
    visualization.title = 'Ist- und Soll-Fertigstellungstermine aller Aufträge ';
    visualization.labels = sortedJobs.map(job => job.name + ' (ID: ' + job.id + ')');
    visualization.datasets = [dataset1, dataset2];
    visualization.xLabel = 'Aufträge';
    visualization.yLabel = 'Zeiteinheiten';

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

  private generateCumulatedSetupTimesVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Kumulierte Rüstzeiten';

    // '[0]' possible since only one machine exists:
    const maxStartTime = Math.max(...this.jobs.map(job => job.operationsOnMachines[0].startTimestamp));

    let previousJob: ScheduledJob;

    for (let i = 0; i <= maxStartTime; i++) {
      const jobStartedAtTimestamp = this.jobs.find(job => job.operationsOnMachines[0].startTimestamp === i);

      if (jobStartedAtTimestamp) {
        if (i > 0) {
          // previousJob is defined here, since production starts at 0
          const previousSetupTime = previousJob.setupTimesToOtherJobs.find(sT => sT.idTo === jobStartedAtTimestamp.id).duration;
          dataset.data.push(Math.max(...dataset.data.filter(d => d !== undefined)) + previousSetupTime);
          labels.push('' + i);
        } // no else as zero is already added by default
        previousJob = jobStartedAtTimestamp;
      } else {
        labels.push('');
        dataset.data.push(undefined);
      }
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Kumulierte Rüstzeiten zu Produktionsstartzeitpunkten';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Zeiteinheiten';
    visualization.yLabel = 'Kumulierte Rüstzeiten';
    return visualization;
  }

  private generateComparisonMeanSetupTimesVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['Lösung', 'Problem (gesamt)'];
    dataset.data = [];
    dataset.label = 'Durchschnittliche Rüstdauer';


    const summedSetupDurations = this.jobs
      .map(job => job.setupTimesToOtherJobs
        .map(sT => sT.duration)
        .reduce((d1, d2) => d1 + d2))
      .reduce((td1, td2) => td1 + td2);

    dataset.data.push(this.calculateMeanSetupTimeKpi().kpi);
    dataset.data.push(summedSetupDurations / ((this.jobs.length - 1) * this.jobs.length));

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_BAR;
    visualization.title = 'Durchschnittliche Rüstdauer der Lösung und des Problems';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Durschnittswerte';
    visualization.yLabel = 'Zeiteinheiten';
    return visualization;
  }

  private generateComparisonSelectedAndMeanSetupTimeVisualization(): ChartData {
    const labels = [];
    const average = new Dataset();
    average.data = [];
    average.label = 'Reihenfolgeunabhängige Durchschnittsrüstzeit';
    const solution = new Dataset();
    solution.data = [];
    solution.label = 'Reihenfolgebedingte Rüstzeit';

    let previousJob: ScheduledJob;
    for (const job of this.getJobsSortedByFinishingDate()) {

      const avg = this.jobs
        .filter(_job => _job.id !== job.id) // Filter current out current job
        .map(_job => _job.setupTimesToOtherJobs
          .find(sT => sT.idTo === job.id).duration
        ).reduce((d1, d2) => d1 + d2) / (this.jobs.length - 1);

      average.data.push(avg);
      solution.data.push(previousJob ? previousJob.setupTimesToOtherJobs.find(sT => sT.idTo === job.id).duration : 0);
      labels.push(job.name + ' (ID: ' + job.id + ')');
      previousJob = job;
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title =
      'Vergleich der reihenfolgebedingten Rüstzeiten mit den reihenfolgeunabhängigen Durchschnittsrüstzeiten zu den einzelnen Aufträgen';
    visualization.labels = labels;
    visualization.datasets = [solution, average];
    visualization.xLabel = 'Aufträge in Abarbeitungsreihenfolge';
    visualization.yLabel = 'Zeiteinheiten';
    return visualization;
  }

  private generateValueToMinimizeAtIterations(): ChartData {
    const dataset = new Dataset();
    const labels = [];
    dataset.data = [];
    dataset.label = this.objectiveFunction;

    for (let i = 1; i <= this.localSearchBestValuesForIterations.length; i++) {
      labels.push('' + i);
      dataset.data.push(this.localSearchBestValuesForIterations[i - 1]);
    }

    const visualization = new ChartData();
    visualization.visualizableAs = ChartType.CJS_LINE;
    visualization.title = 'Betrachteter zu minimierender Zielfunktionswert (' + this.objectiveFunction + ') nach jeder Iteration';
    visualization.labels = labels;
    visualization.datasets = [dataset];
    visualization.xLabel = 'Iteration';
    visualization.yLabel = this.objectiveFunction;
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

  private getColorsAsSpecifiedInGanttFirstMachine(): string[] {

    let colors = this.generateUniqueJobColorValues();

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

  private logSchedulingProcedure(machineNr: number, description: string, type: LogEventType, time?: number): void {
    if (this.isLoggingConfigured) {
      time = time === undefined ? this.currentTimestampInScheduling : time;
      this.logging.push(new SchedulingLogEntry(time, machineNr, description, type));
    }
  }

  private jobStringForLogging(job: ScheduledJob): string {
    return '\'' + job.name + '\' (ID: ' + job.id + ')';
  }

  private jobListStringForLogging(jobs: ScheduledJob[]): string {
    return jobs.map(job => this.jobStringForLogging(job)).join(' -> ');
  }
}
