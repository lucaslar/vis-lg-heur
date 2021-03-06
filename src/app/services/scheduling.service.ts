import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {Job} from '../model/scheduling/Job';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {PriorityRule} from '../model/enums/PriorityRule';
import {Machine} from '../model/scheduling/Machine';
import {RelaxableOneMachineScheduledJob, ScheduledJob} from '../model/scheduling/ScheduledJob';
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
import {SchedulingPlanForMachine} from '../model/scheduling/SchedulingPlanForMachine';
import {BottleneckRelation} from '../model/scheduling/BottleneckRelation';
import {DialogContent} from '../model/internal/dialog/DialogContent';
import {DialogType} from '../model/internal/dialog/DialogType';
import {BetaFormalPipe} from '../pipes/beta-formal.pipe';
import {MachineConfig} from '../model/enums/MachineConfig';

/**
 * Service used in order schedule jobs using a given heuristic and generate the data to be displayed.
 * Created as Service in order to decapsulatethe this procedure from the rest of the application.
 */
@Injectable({
  providedIn: 'root'
})
export class SchedulingService {

  /**
   * Selected objective function to be minimized
   */
  private objectiveFunction: ObjectiveFunction;

  /**
   * Definer of the heuristic used for scheduling
   */
  private heuristicType: HeuristicDefiner;

  /**
   * Specified priority rules (in this order) if the same named heuristic is applied
   */
  private priorityRules: PriorityRule[];


  /**
   * Jobs to be scheduled
   */
  private jobs: ScheduledJob[];

  /**
   * All machines the jobs are to beschuedled on
   */
  private machines: Machine[];

  /**
   * Timestamp to be when producing
   */
  private currentTimestampInScheduling: number;

  /**
   * For local search only: Array containing the best value to be minimized after each iteration
   */
  private localSearchBestValuesForIterations: number[];


  /**
   * The user's logging configuration to be considered in scheduling
   */
  private isLoggingConfigured: boolean;

  /**
   * All logs for scheduling
   */
  private logging: SchedulingLogEntry[];

  /**
   * True if all due dates of the jobs to be scheduled are configured, false if not
   */
  private isEachDueDateConfigured: boolean;

  /**
   * Machine configuration (as formal/alpha param)
   */
  private machineConfigParam: MachineConfig;

  constructor(public storage: StorageService) {
  }

  /**
   * @param heuristicDefiner Definer of the heuristic a potential warning is to be created for
   * @returns Content of a confirm dialog concerning scheduling if a heuristic may take too long to find a solution due to complexity or
   *          undefined if no warning/confirmation is needed
   */
  getComplexityWarning(heuristicDefiner: HeuristicDefiner): DialogContent | undefined {
    if (heuristicDefiner === HeuristicDefiner.LOCAL_SEARCH) {
      return this.getLocalSearchWarningIfNeeded();
    } else if (heuristicDefiner === HeuristicDefiner.SHIFTING_BOTTLENECK) {
      return this.getShiftingBottleneckWarningIfNeeded();
    } else {
      return undefined;
    }
  }

  /**
   * Starts the scheduling process with a given heuristic and returns the result data (diagrams, content etc.) of the found solution.
   *
   * @param heuristicDefiner Definer of the heuristic to be used for scheduling
   * @returns Result data of the solution found by scheduling with the given heuristic
   */
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

  /**
   * @returns Warning/confirm dialog content (for running local search) if 35 jobs or more a configured or undefined in case of less
   */
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
      );
    } else {
      return undefined;
    }
  }

  /**
   * Checks the maximum complexity the shifting bottleneck heuristic might have concerning the current jobs/machines configuration and
   * returns a warning in case of exceeding a recommended maximum complexity.
   *
   * @returns Warning/confirm dialog content (for running shifting bottleneck heuristic) if the calculated maximum complexity is higher
   *          than the recommended one (comparison of complexities included in dialog)
   */
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
      );
    } else {
      return undefined;
    }
  }

  /**
   * Initializes all (relevant) objects to be used for scheduling and/or generating the result data based on the heuristic to be used for
   * scheduling. By deep copying values from the {StorageService} the logic of this class is decapsulated from the rest of the
   * application.
   *
   * @param heuristicDefiner Definer of the heuristic to be used for scheduling
   */
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
    this.isEachDueDateConfigured =
      this.storage.getValueDefinitionStatus(DefinableValue.BETA_DUE_DATES) === DefinitionStatus.COMPLETELY_DEFINED;
    this.machineConfigParam = this.storage.machineConfigParam;

    this.isLoggingConfigured = this.storage.isLoggingConfigured;
    if (this.isLoggingConfigured) {
      this.logging = [];
    }
  }

  /**
   * Deletes all objects and values used for scheduling and/or generating the result data. Implemented since this service is not destroyed
   * after successful scheduling/returning result data.
   */
  private deleteTemporarilyStoredData(): void {
    delete this.jobs;
    delete this.machines;
    delete this.logging;
    delete this.currentTimestampInScheduling;
    delete this.heuristicType;
    delete this.priorityRules;
    delete this.objectiveFunction;
    delete this.isEachDueDateConfigured;
    delete this.machineConfigParam;
    delete this.isLoggingConfigured;
    delete this.logging;
  }

  // Static scheduling:

  /**
   * Basic logic for running NEH heuristic or Local Search: Finding of the best permutation and then running this solution.
   */
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

  /**
   * @returns Best permutation found by the NEH-heuristic
   */
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

  /**
   * (Pre)sorts jobs based on the selected objective function to be minimized and returns the sorted list.
   *
   * @returns (Pre)sorted jobs to be used in the NEH-heuristic
   */
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

  /**
   * Logs (Scheduling Log) that presortng jobs is started and the respective value the jobs are sorted by
   */
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
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK) {
      preSortBasedOn = 'ihren gewichteten gewünschten Fertigstellungsterminen';
    }

    this.logSchedulingProcedure(1, 'Maschinenübergreifendes Vorsortieren der Aufträge nach ' + preSortBasedOn,
      LogEventType.HEURISTIC_BASED_SORTING);
  }

  /**
   * @returns Best permutation found by the Local Search
   */
  private bestPermutationLocalSearch(): ScheduledJob[] {
    let iteration = 0;
    let startValue: number;
    let bestPermutationYet = this.jobs;
    let currentBestValue = this.getCompareValueForPermutation(bestPermutationYet);
    this.localSearchBestValuesForIterations = [currentBestValue];

    do {
      iteration++;
      startValue = currentBestValue;

      this.logSchedulingProcedure(1, 'Beginn der ' + iteration + '. Iteration mit zu minimierendem Zielfunktionswert ' +
        'für derzeitige Permutation: ' + startValue + ' (' + this.objectiveFunction + ')',
        LogEventType.HEURISTIC_BASED_SORTING);

      const possiblePermutations: ScheduledJob[][] = this.createPermutationsBySwappingJobs(bestPermutationYet, iteration);
      possiblePermutations.forEach(permutation => {
        const comparisonValue = this.getCompareValueForPermutation(permutation);
        if (comparisonValue < currentBestValue) {
          this.logSchedulingProcedure(1, 'Verbesserter zu minimierender Zielfunktionswert: ' + comparisonValue +
            ' anstatt ' + currentBestValue + ' (' + this.objectiveFunction + ') bei Abarbeitung von Permutation: '
            + this.jobListStringForLogging(permutation), LogEventType.HEURISTIC_BASED_SORTING);

          currentBestValue = comparisonValue;
          bestPermutationYet = permutation;
        }
      });
      this.localSearchBestValuesForIterations.push(currentBestValue);
    } while (currentBestValue < startValue);

    this.logSchedulingProcedure(1, this.localSearchBestValuesForIterations.length + '. Iteration: Keine Permutation ' +
      'gefunden, die den zu minimierenden Zielfunktionswert  (' + this.objectiveFunction + ') verbessern würde, finaler Wert: '
      + currentBestValue, LogEventType.HEURISTIC_BASED_SORTING);

    return bestPermutationYet;
  }

  /**
   * Checks which value of a job is to be considered in order to compare jobs based on objective function to be minimized.
   * That is:
   * - due date
   * - total machining time
   * - due date / job weight
   * - total machining time / job weight
   *
   * @param job Job the value for comparison is to be returned of
   * @returns Value of the given job that is considered for comparison
   */
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
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK) {
      return job.dueDate / job.weight;
    }
  }

  /**
   * @param existingPermutation Permutation based on which new permutations are to be created
   * @param newJob Job to be added on each position in permutation
   * @returns All possible permutations by adding the given new job on each position of the given permutation
   */
  private createPermutationsByAddingJob(existingPermutation: ScheduledJob[], newJob: ScheduledJob): ScheduledJob[][] {
    const permutations: ScheduledJob[][] = [];
    for (let i = 0; i <= existingPermutation.length; i++) {
      const copiedPermutation = existingPermutation.map(job => new ScheduledJob(job));
      copiedPermutation.splice(i, 0, newJob);
      permutations.push(copiedPermutation);
    }
    return permutations;
  }

  /**
   * @param existingPermutation Permutation based on which new permutations are to be created
   * @param iteration Curent Local Search iteration used for logging
   * @returns All possible permutations by swapping two jobs of the given permutation
   */
  private createPermutationsBySwappingJobs(existingPermutation: ScheduledJob[], iteration: number): ScheduledJob[][] {
    this.logSchedulingProcedure(1, iteration + '. Iteration: Beginn der Aufstellung von Permutationen ausgehend von ' +
      this.jobListStringForLogging(existingPermutation), LogEventType.HEURISTIC_BASED_SORTING);

    const permutations: ScheduledJob[][] = [];
    for (let i = 0; i < existingPermutation.length; i++) {
      for (let j = i + 1; j < existingPermutation.length; j++) {
        const copiedPermutation = existingPermutation.map(job => new ScheduledJob(job));
        [copiedPermutation [i], copiedPermutation[j]] = [copiedPermutation[j], copiedPermutation[i]];
        permutations.push(copiedPermutation);
        this.logSchedulingProcedure(1, iteration + '. Iteration: Aufgestellte Permutation durch das Tauschen von ' +
          this.jobStringForLogging(copiedPermutation[i]) + ' & ' + this.jobStringForLogging(copiedPermutation[j]) + ': ' +
          this.jobListStringForLogging(copiedPermutation), LogEventType.HEURISTIC_BASED_SORTING);
      }
    }

    this.logSchedulingProcedure(1, iteration + '. Iteration: Alle möglichen Permutationen aufgestellt (' +
      permutations.length + ' Stück)', LogEventType.HEURISTIC_BASED_SORTING);

    return permutations;
  }

  /**
   * Compares given permutations by checking the objective function to be minimized after the (mocked) production of each.
   * The permutation with the lowest value is returned (in case of several with the same value the first of these).
   *
   * @param permutations Permutations to be compared concerning the objective function to be minimized
   * @returns Best permutation concerning the objective function to be minimized
   */
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

  /**
   * @param permutation Permutation the compare value is to be calculated of
   * @returns Value to be minimized (considering objective function) in case of producing the given permutation
   */
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

  /**
   * Mocks the production of a given permutation and returns the makespan + 1.
   *
   * @param permutation Permutation the production is to be mocked for
   * @param isLog (optional) if true, the production will be logged (Scheduling log)
   * @returns Makespan of production + 1
   */
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

  /**
   * Contains each steps to be done at a timestamp in dynamic scheduling:
   * - handle current jobs on each machine
   * - add (new) jobs to machine queues
   * - sorting of job relevant job queues and subsequent starting of new productions (also considers setup times in last step(s))
   */
  private proceedDynamicScheduling(): void {
    this.handleEachCurrentJobOfMachine();
    this.addJobsToMachineQueues();

    // Sort queues of free machines (with jobs in queue) and produce best job:
    this.machines
      .filter(machine => !machine.currentJob && machine.jobQueue.length)
      .forEach(machine => {

          // No sorting for each timestamp in NN-Heuristic (only once after setting up)
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
  /**
   * Checks for each currently producing machine if the respective job's operation is finished and if so frees these machine
   *
   * @param mockTimestamp (optional) given timestamp, if not defined, {currentTimestampInScheduling} will be considered
   */
  private handleEachCurrentJobOfMachine(mockTimestamp?: number): void {
    // mock timestamp used for static procedures only
    const usedTimestamp = mockTimestamp === undefined ? this.currentTimestampInScheduling : mockTimestamp;
    this.machines
      .filter(machine => machine.currentJob)
      .forEach(machine => machine.freeIfCurrentJobOperationFinished(usedTimestamp));
  }

  // Called for any dynamically executed heuristic (before calling the heuristic based sorting) and static procedure mocking
  /**
   * Adds each job that is neither finished nor currently in production to the queue of the machine of its respective next operation
   * (Jobs that are already in this queue will not be added again).
   *
   * @param givenJobs (optional) Jobs to be considered, if not defined {jobs} will be used
   */
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
  /**
   * Compares two given jobs based on the selected heuristic/priority rules and returns the sorting result value.
   *
   * @param jobA First job to be compared
   * @param jobB Second job to be compared
   * @param machineNr (used for logging) Number of the machine on which the two jobs are compared
   * @returns Sorting result value after comparing the two given jobs
   */
  private dynamicComparisonResultForCurrentHeuristic(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number): number {
    if (this.heuristicType === HeuristicDefiner.PRIORITY_RULES) {
      return this.compareJobsByPriorityRules(jobA, jobB, machineNr);
    } else if (this.heuristicType === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      return this.compareJobsBySetupTimes(jobA, jobB, machineNr);
    }
  }

  /**
   * Compares two jobs using the defined priority rules. In case of equal values, the jobs are compared using the respective next priority
   * rule. In case of no next rule, the jobs first job is preferred (-> "first come, first serve")
   *
   * @param jobA First job to be compared
   * @param jobB Second job to be compared
   * @param machineNr (used for logging) Number of the machine on which the two jobs are compared
   * @returns Sorting result value after comparing the two given jobs using the defined priority rules
   */
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

  /**
   * @param job Job the respective value for comparing is to be calculated/checked and returned of
   * @param priorityRule Priority rule defining the value based on which the job is to compared
   * @returns Value for a job to be considered in sorting based on a given priority rule
   */
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

  /**
   * Compares the setup times for two given jobs. That is:
   * - in case of no previously produced job: The smallest setup time from the respective job to any other
   * - in case of a previously produced job: The setup time from the previously produced job to the given job
   *
   * @param jobA First job to be compared
   * @param jobB Second job to be compared
   * @param machineNr (used for logging) Number of the machine on which the two jobs are compared
   * @returns Difference between the considered setup times of the two jobs (usable for sorting)
   */
  private compareJobsBySetupTimes(jobA: ScheduledJob, jobB: ScheduledJob, machineNr: number): number {

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

  /**
   * Schedules the jobs using the Shifting-Bottleneck-Heuristic.
   * Basic procedure:
   * - check if the problem has to be solved using the heuristic (if not: Direct start of production (not considered in the further course))
   * - creation of one machine problems, the following steps are to be seen as iterating as long as any machine has an
   *   undefined scheduling plan:
   *   - exact solving of these problems (1 | rj | Lmax)
   *   - selecting the permutation for which Lmax is the highest and considering this permutation as the scheduling plan on the respective
   *     machine
   *   - updating the consequent new job relations for the remaining One machine problems and the Lower Bound
   * After successful scheduling: Production with given permutations for each machine.
   */
  private scheduleByShiftingBottleneckHeuristic(): void {

    let lowerBoundMakespan = Math.max.apply(Math, this.jobs.map(job => job.totalMachiningTime));

    this.logSchedulingProcedure(1, 'Maschinenunabhängiges Ermitteln der kleinstmöglichen Gesamtbearbeitungszeit ' +
      '(längste Gesamtbearbeitungszeit eines Auftrags): ' + lowerBoundMakespan, LogEventType.HEURISTIC_BASED_SORTING);

    const schedulingIgnoringMachineCapacity = this.getSchedulingIgnoringMachineCapacity(lowerBoundMakespan);
    const isOptimalSolution = !schedulingIgnoringMachineCapacity
      .filter(machine => machine.some(jobsAtTimestamp => jobsAtTimestamp.length > 1)).length;

    if (!isOptimalSolution) {
      this.logSchedulingProcedure(1, 'Es konnte keine optimale Lösung ermittelt werden, da sich Zeiten an den ' +
        'einzelnen Maschinen überschneiden würden, Beginn der Aufstellung von Ein-Maschinen-Problemen (1|rj|Lmax)',
        LogEventType.HEURISTIC_BASED_SORTING);

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
      this.logSchedulingProcedure(1, 'Es konnte eine optimale Lösung ermittelt werden, da sich keine Zeiten ' +
        'an den einzelnen Maschinen überschneiden', LogEventType.HEURISTIC_BASED_SORTING);

      for (let i = 0; i < this.machines.length; i++) {
        this.logSchedulingProcedure(i + 1, 'Fertig bestimmte Warteschlange: ' + this.jobListStringForLogging(
          // There must be only one job at [0] if this part of code is reached.
          [...new Set(schedulingIgnoringMachineCapacity[i].map(job => job[0]))]), LogEventType.JOB_QUEUE);
      }
      this.currentTimestampInScheduling = this.mockProductionOfPermutation(this.jobs, true);
    }
  }

  /**
   * @param lowerBoundMakespan Minimum possible makespan
   * @returns Scheduling plans for each machine
   */
  private initializeOneMachineSchedules(lowerBoundMakespan: number): SchedulingPlanForMachine[] {
    return this.machines
      .map(machine => new SchedulingPlanForMachine(machine.machineNr,
        this.jobs
          .map(job => new RelaxableOneMachineScheduledJob(job, machine.machineNr, lowerBoundMakespan)
          )
        )
      );
  }

  /**
   * @returns Initialized array containing relations between jobs (precedence constraints (prec)).
   */
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

  /**
   * @returns Initialized array containing the inverted relations between jobs for finding the "backward-longest-path"
   */
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

  /**
   * Calls method to update the relation arrays based on a new final schedule and the consequent new precedence constraints at first.
   * Later on, the due date and the availability of each job in the yet to solve scheduling plans is updated based on these values. In order
   * to do so, each maximum path (backward and forward) of each job is calculated.
   *
   * @param schedulesToUpdate Array containing all schedules to be updated
   * @param finalSchedule Exactly solved schedule the new relations based on which the new relations are to be created
   * @param invertedBottleneckRelations Inverted precedence constraints to be updated
   * @param bottleneckRelations Precedence constraints to be updated
   * @param lowerBound Lower bound of the (total) problem
   */
  private updateUnscheduledRelations(schedulesToUpdate: SchedulingPlanForMachine[],
                                     finalSchedule: SchedulingPlanForMachine,
                                     invertedBottleneckRelations: BottleneckRelation[],
                                     bottleneckRelations: BottleneckRelation[],
                                     lowerBound: number): void {

    this.updateRelationTables(invertedBottleneckRelations, bottleneckRelations, finalSchedule);

    schedulesToUpdate.forEach(schedule =>
      schedule.scheduledJobs.forEach(job => {
        const longestPastBranch = this.getLongestTimeForPathStarting(job.id, schedule.machineNr, invertedBottleneckRelations);
        const longestFutureBranch = this.getLongestTimeForPathStarting(job.id, schedule.machineNr, bottleneckRelations);
        job.onMachineAvailability = longestPastBranch;
        job.onMachineDueDate = lowerBound - longestFutureBranch;
      })
    );
  }

  /**
   * Updates the relation arrays based on a new final schedule and the consequent new precedence constraints.
   *
   * @param invertedBottleneckRelations Inverted precedence constraints to be updated
   * @param bottleneckRelations Precedence constraints to be updated
   * @param finalSchedule Exactly solved schedule the new relations based on which the new relations are to be created
   */
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

  /**
   * @param jobId Id of the job for which the path with the maximum value is to be calculated
   * @param machineNr Number of the machine the path is to be started on (for the given job)
   * @param bottleneckRelations All existing relations (may be inverted relations, too)
   * @returns Maximum value for any path starting from a certain job node
   */
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

  /**
   * @param maxTime Maximum total job time
   * @returns Three dimensional array representing jobs on machines for each timestamp (multiple jobs on a machine possibe as machine
   *          capacity is ignored)
   */
  private getSchedulingIgnoringMachineCapacity(maxTime: number): ScheduledJob[][][] {
    const schedulingIgnoringMachineCapacity = this.machines.map(() => new Array(maxTime));

    this.logSchedulingProcedure(1, 'Maschinenübergreifendes Aufstellen von Ablaufplänen ohne Berücksichtigung von ' +
      'Maschinenkapazitäten', LogEventType.HEURISTIC_BASED_SORTING);

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

  /**
   * Calculates the exact best permutations for given scheduling plans (reducing Lmax) and returns the one with the highest Lmax.
   * In case of many permutations with the same value for Lmax, the first one ist returned.
   *
   * @param schedulingPlans Scheduling plans to be optimized
   * @returns Optimally scheduled permutation with the highest value for Lmax
   */
  private getScheduleWithHighestOptimalLmax(schedulingPlans: SchedulingPlanForMachine[]): SchedulingPlanForMachine {
    schedulingPlans.forEach(schedule => {
      schedule.scheduledJobs = this.getBestPermutationByBranchAndBound(schedule.scheduledJobs);

      this.logSchedulingProcedure(schedule.machineNr, 'Ermittelte optimale Reihenfolge des Ein-Maschinen-Problems (1|rj|Lmax ' +
        'optimal gelöst mit Branch & Bound): ' + this.jobListStringForLogging(schedule.scheduledJobs) + ', Lmax = ' +
        this.getMaxLatenessForSortedOneMachineJobs(schedule.scheduledJobs), LogEventType.HEURISTIC_BASED_SORTING);

    });
    const scheduleWithHighestOptimalLmax = schedulingPlans.find(schedule => this.getMaxLatenessForSortedOneMachineJobs(
      schedule.scheduledJobs) === Math.max.apply(Math,
      schedulingPlans.map(_schedule => this.getMaxLatenessForSortedOneMachineJobs(_schedule.scheduledJobs))));

    this.logSchedulingProcedure(scheduleWithHighestOptimalLmax.machineNr, 'Maschine wird fortan nicht mehr betrachtet, da ' +
      'größter Wert für Lmax, fertig bestimmte Warteschlange: ' +
      this.jobListStringForLogging(scheduleWithHighestOptimalLmax.scheduledJobs), LogEventType.JOB_QUEUE);

    return scheduleWithHighestOptimalLmax;
  }

  /**
   * Exactly solves a problem by using the Branch and Bound algorithm and returns the optimal schedule.
   * Basic procedure:
   * - determine current best solution, lower and upper bound
   * - follow branches that may deliver the best solution (better than the current) and dynamically update current best solution, LB and UB
   * - repeat step two for new branches (or nodes starting branches) as long as they may contain a better solution
   *
   * @param jobs Jobs to scheduled
   * @returns Optimal schedule for given jobs
   */
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

  /**
   * @param jobs Jobs the maximum lateness of is to be calculated (in order for production)
   * @returns Maximum lateness for production of given jobs
   */
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

  /**
   * @param jobs Relaxable jobs the maximum lateness of is to be calculated (each job is possible to be paused in its production in order
   *        to produce another one instead (in order to minimize its delay))
   * @returns Maximum lateness for production of given jobs
   */
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

  /**
   * Calculates the maximum lateness of given, partly fixed, jobs.
   * First, all fixed jobs are produced, the relaxable jobs are following.
   *
   * @param jobs Partly relaxable jobs the maximum lateness of is to be calculated
   * @param fixtures Ids of those jobs that cannot be paused in their production
   * @returns Maximum lateness for production of given jobs
   */
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

  /**
   * Production with given schedules for each machine.
   *
   * @param finalOneMachineSchedules Schedules defining the order in which jobs are to produced on each machine
   */
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

  // called after successful scheduling
  /**
   * @returns Generated result data for the found scheduling solution
   */
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
  /**
   * @returns Generated general result data based on the found scheduling solution/heuristic/definitions
   */
  private generateGeneralSchedulingData(): GeneralSchedulingData {
    const data = new GeneralSchedulingData();
    data.machineConfig = this.machineConfigParam;
    data.numberOfJobs = this.jobs.length;
    data.numberOfMachines = this.machines.length;
    data.formalBeta = new BetaFormalPipe().transform(this.objectiveFunction);
    data.objectiveFunction = this.objectiveFunction;
    data.priorityRules = this.priorityRules; // may be undefined
    data.isEachDueDateConfigured = this.isEachDueDateConfigured;

    if (this.heuristicType === HeuristicDefiner.LOCAL_SEARCH) {
      const iterationsKpi = new Kpi();
      iterationsKpi.kpi = this.localSearchBestValuesForIterations.length - 1;
      iterationsKpi.iconClasses = ['fas', 'fa-redo'];
      iterationsKpi.title = 'Iterationen bis zur Lösungsfindung';
      data.iterations = iterationsKpi;
    }

    return data;
  }

  /**
   * @returns Generated scheduling times data for the found scheduling solution
   */
  private generateSchedulingTimesData(): SchedulingTimesData {
    const data = new SchedulingTimesData();
    data.allMachineOperationsTimeline = this.generateAllMachineOperationsTimeline();
    data.machineTables = this.generateAllMachineTables();
    return data;
  }

  /**
   * @returns Generated timeline data for the found scheduling solution with unique colors
   */
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

  /**
   * @returns Generated machine table data for the found scheduling solution with unique colors (same as in timeline)
   */
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

  /**
   * @param sortedFirstMachineJobStings Sorted strings representing the jobs produced on the first machine
   * @returns Map containing each job string as key and respective colors as value (unique and same as in timeline)
   */
  private generateColorMapForMachineTables(sortedFirstMachineJobStings: string[]): Map<string, string> {
    const colorMap: Map<string, string> = new Map();
    const colors = this.generateUniqueJobColorValues().map(rgb => 'rgb(' + rgb + ')');
    for (let i = 0; i < sortedFirstMachineJobStings.length; i++) {
      colorMap.set(sortedFirstMachineJobStings[i], colors[i]);
    }
    return colorMap;
  }

  /**
   * @returns Generated visualizable data concerning the solved problem itself
   */
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

  /**
   * @returns Generated data for visualizing the total durations on each machine
   */
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

  /**
   * @returns Generated data for visualizing the total job times (and due dates if completely configured)
   */
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
    visualization.colors = this.getColorsAsSpecifiedInGanttFirstMachine().map(color => 'rgba(' + color + ',0.8)');
    visualization.title = 'Gesamtbearbeitungsdauer ' + (this.isEachDueDateConfigured ? 'und gewünschte Fertigstellungstermine ' : '')
      + 'aller Aufträge';
    visualization.labels = sortedJobs.map(job => job.name + ' (ID: ' + job.id + ')');
    visualization.datasets = [dataset];
    visualization.xLabel = 'Aufträge';
    visualization.yLabel = 'Zeiteinheiten';

    if (this.isEachDueDateConfigured) {
      const dueDatesDataset = new Dataset();
      dueDatesDataset.data = sortedJobs.map(job => job.dueDate);
      dueDatesDataset.label = 'Gewünschter Fertigstellungstermin';
      visualization.datasets.push(dueDatesDataset);
    }

    return visualization;
  }

  /**
   * @returns Generated data for visualizing the weighting of jobs
   */
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

  /**
   * @returns Generated KPIs based on the found scheduling solution/heuristic/definitions
   */
  private generateSolutionQualityData(): Kpi[] {
    const data = [];

    data.push(this.calculateTotalDurationKpi());
    data.push(this.calculateMeanCycleTimeKpi());
    data.push(this.calculateMeanJobBacklogKpi());

    // Either none or all jobs must have a due date
    if (this.isEachDueDateConfigured) {
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

  /**
   * @return Calculated total duration as KPI
   */
  private calculateTotalDurationKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-stopwatch'];
    kpi.title = 'Gesamte Durchlaufzeit';
    kpi.kpi = this.currentTimestampInScheduling - 1;
    return kpi;
  }

  /**
   * @return Calculated mean cycle time as KPI
   */
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

  /**
   * @return Calculated mean job backlog as KPI
   */
  private calculateMeanJobBacklogKpi(): Kpi {
    let sum = 0;
    this.jobs.forEach(job => sum += job.finishedAtTimestamp);

    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-cubes'];
    kpi.title = 'Mittlerer Auftragsbestand';
    kpi.kpi = +(sum / (this.currentTimestampInScheduling - 1));
    return kpi;
  }

  /**
   * @return Calculated mean delay as KPI
   */
  private calculateMeanDelayKpi(): Kpi {
    const kpi = new Kpi();
    kpi.title = 'Mittlere Verspätung';
    kpi.kpi = +this.jobs
        .map(job => job.delay)
        .reduce((a, b) => a + b)
      / this.jobs.length;
    return kpi;
  }

  /**
   * @return Calculated standard deviation of delay as KPI
   */
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

  /**
   * @return Calculated sum of delays as KPI
   */
  private calculateSumOfDelaysKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['functions'];
    kpi.title = 'Summe der Verspätungen';
    kpi.kpi = +this.jobs
      .map(job => job.delay)
      .reduce((delay1, delay2) => delay1 + delay2);
    return kpi;
  }

  /**
   * @return Calculated maximum delay as KPI
   */
  private calculateMaximumDelayKpi(): Kpi {
    const kpi = new Kpi();
    kpi.iconClasses = ['fas', 'fa-history'];
    kpi.title = 'Maximale Verspätung';
    kpi.kpi = this.jobs
      .map(job => job.delay)
      .reduce((prevDelay, currentDelay) => prevDelay > currentDelay ? prevDelay : currentDelay);
    return kpi;
  }

  /**
   * @return Calculated mean setup time as KPI
   */
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

  /**
   * @returns Generated visualizable data concerning found solution based on the used heuristic/definition of due dates
   */
  private generateVisualizableSolutionQualityData(): VisualizableSolutionQualityData {
    const data = new VisualizableSolutionQualityData();

    data.finishedJobsAtTimestamp = this.generateFinishedJobsAtTimestampVisualization();

    if (this.isEachDueDateConfigured) {
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

  /**
   * @returns Generated data for visualizing the finished jobs at each timestamp
   */
  private generateFinishedJobsAtTimestampVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Fertiggestellte Aufträge';

    const sortedJobs = this.getJobsSortedByFinishingDate();
    for (let i = 1; i < this.currentTimestampInScheduling; i++) {
      const jobsFinishedAtTimestamp = sortedJobs.filter(job => job.finishedAtTimestamp === i);
      labels.push(jobsFinishedAtTimestamp.length ? '' + i : '');
      dataset.data.push(jobsFinishedAtTimestamp.length ?
        sortedJobs.indexOf(jobsFinishedAtTimestamp[0]) + jobsFinishedAtTimestamp.length : undefined);
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

  /**
   * @returns Generated data for visualizing the finish timestamps (in unique colors as in timeline) and due dates of jobs
   */
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

  /**
   * @returns Generated data for visualizing the cumulated delays of jobs
   */
  private generateCumulatedDelaysVisualization(): ChartData {
    const dataset = new Dataset();
    const labels = ['0'];
    dataset.data = [0];
    dataset.label = 'Kumulierte Verspätungszeiten';

    for (let i = 1; i < this.currentTimestampInScheduling; i++) {
      const jobsFinishedAtTimestamp = this.jobs.filter(job => job.finishedAtTimestamp === i);
      const isDataToBeAdded = jobsFinishedAtTimestamp.length &&
        (jobsFinishedAtTimestamp.some(job => !!job.delay) || i === this.currentTimestampInScheduling - 1);
      labels.push(isDataToBeAdded ? '' + i : '');

      dataset.data.push(isDataToBeAdded ?
        Math.max(...dataset.data.filter(d => d !== undefined)) +
        jobsFinishedAtTimestamp.map(job => job.delay).reduce((d1, d2) => d1 + d2) : undefined);
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

  /**
   * @returns Generated data for total number of delayed and not delayed jobs
   */
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

  /**
   * @returns Generated data for visualizing the cumulated setup times of the whole production process
   */
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

  /**
   * @returns Generated data for compating the global mean setup time and the mean setup time of the found solution
   */
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

  /**
   * @returns Generated data for visualizing the comparison of average setup times to a job and the selected setup time
   */
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

  /**
   * @returns Generated data for visualizing the value to be minimized after each iteration of a Local Search used for scheduling
   */
  private generateValueToMinimizeAtIterations(): ChartData {
    const dataset = new Dataset();
    const labels = [];
    dataset.data = [];
    dataset.label = this.objectiveFunction;

    for (let i = 0; i < this.localSearchBestValuesForIterations.length; i++) {
      labels.push('' + i);
      dataset.data.push(this.localSearchBestValuesForIterations[i]);
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

  /**
   * @returns Jobs sorted by the timestamp they have been finished at
   */
  private getJobsSortedByFinishingDate(): ScheduledJob[] {
    return this.jobs.sort((j1, j2) => j1.finishedAtTimestamp - j2.finishedAtTimestamp);
  }

  /**
   * Calculates unique colors based on the number of existing jobs. Uniqueness for many jobs is given by bleaching defined base colors.
   *
   * @returns Unique colors to be used for jobs
   */
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

  /**
   * @returns Unique colors sorted as the produced jobs on the first machine
   */
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

  /**
   * If logging is configured: creates a log entry to be stored in {logging}.
   *
   * @param machineNr Number of the machine the event to be logged took place
   * @param description Description of the event to be logged
   * @param type Type of the event to be logged
   * @param time Timestamp of the event to be logged
   */
  private logSchedulingProcedure(machineNr: number, description: string, type: LogEventType, time?: number): void {
    if (this.isLoggingConfigured) {
      time = time === undefined ? this.currentTimestampInScheduling : time;
      this.logging.push(new SchedulingLogEntry(time, machineNr, description, type));
    }
  }

  /**
   * @param job Job the string representation for logging is to be created for
   * @returns String representation of a job for logging
   *
   */
  private jobStringForLogging(job: ScheduledJob): string {
    return '\'' + job.name + '\' (ID: ' + job.id + ')';
  }

  /**
   * @param jobs Permutation the string representation for logging is to be created for
   * @returns String representation of a permutation for logging
   */
  private jobListStringForLogging(jobs: ScheduledJob[]): string {
    return jobs.map(job => this.jobStringForLogging(job)).join(' -> ');
  }
}
