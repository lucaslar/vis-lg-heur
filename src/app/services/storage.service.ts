import {Injectable} from '@angular/core';
import {Job} from '../model/scheduling/Job';
import {MachineConfig} from '../model/enums/MachineConfig';
import {DefinableValue} from '../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../model/internal/value-definition/DefinitionStatus';
import {PriorityRule} from '../model/enums/PriorityRule';
import {DialogContent} from '../model/internal/dialog/DialogContent';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {Heuristic} from '../model/scheduling/Heuristic';
import {DialogType} from '../model/internal/dialog/DialogType';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';

/**
 * Service used in order to manage storing and storage-concerning globally usable logic.
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  // Storable values:

  /**
   * Jobs configured by the user
   */
  private _jobs: Job[];

  /**
   * Numer of machines defined by the user
   */
  private _nrOfMachines: number;

  /**
   * Objective function to be minimized selected by the user
   */
  private _objectiveFunction: ObjectiveFunction;

  /**
   * Priority rules selected by the user (in this order)
   */
  private _priorityRules: PriorityRule[];

  /**
   * Represents the user's logging configuration
   */
  private _isLoggingConfigured: boolean;

  // Keys:

  /**
   * String to be appended to each key for storing data of this application
   */
  private readonly PREFIX_KEY = 'VISLGHEUR_';

  /**
   * Key for storable value: jobs
   */
  private readonly JOBS = 'JOBS';

  /**
   * Key for storable value: number of machines
   */
  private readonly NR_OF_MACHINES = 'NR_OF_MACHINES';

  /**
   * Key for storable value: objective function
   */
  private readonly OBJECTIVE_FUNCTION = 'OBJECTIVE_FUNCTION';

  /**
   * Key for storable value: priority rules
   */
  private readonly PRIORITY_RULES = 'PRIORITY_RULES';

  /**
   * Key for storable value: logging configuration
   */
  private readonly IS_LOGGING = 'IS_LOGGING';

  /**
   * Checks the values of a certain given type concerning whether all/the definable data is stated completely, partly or not at all and
   * returns the respective value.
   *
   * @param definableValue Type the definition status of is to be checked.
   * @returns Definition status for given definable value
   */
  getValueDefinitionStatus(definableValue: DefinableValue): DefinitionStatus {
    let expectedDefinitions: number;
    let existingDefinitions: number;

    if (definableValue === DefinableValue.ALPHA_JOB_TIMES) {
      expectedDefinitions = this.jobs.length * this.nrOfMachines;
      existingDefinitions = this.getJobTimesDefinitions();
    } else if (definableValue === DefinableValue.BETA_DUE_DATES) {
      expectedDefinitions = this.jobs.length;
      existingDefinitions = this.jobs.filter(job => job.dueDate).length;
    } else if (definableValue === DefinableValue.BETA_WEIGHTS) {
      expectedDefinitions = this.jobs.length;
      existingDefinitions = this.jobs.filter(job => job.weight).length;
    } else if (definableValue === DefinableValue.BETA_SETUP_TIMES && this.jobs.length > 1) {
      expectedDefinitions = (this.jobs.length - 1) * this.jobs.length;
      existingDefinitions = this.jobs.map(job => job.setupTimesToOtherJobs ? job.setupTimesToOtherJobs
        .filter(setupTime => setupTime.duration !== undefined).length : 0).reduce((num1, num2) => num1 + num2);
    } else if (definableValue === DefinableValue.BETA_SETUP_TIMES) {
      return DefinitionStatus.NOT_DEFINED;
    } else if (definableValue === DefinableValue.PRIORITY_RULES) {
      // Since not all rules have to be selected:
      return this.priorityRules.length ? DefinitionStatus.COMPLETELY_DEFINED : DefinitionStatus.NOT_DEFINED;
    }

    return expectedDefinitions === existingDefinitions ? DefinitionStatus.COMPLETELY_DEFINED
      : existingDefinitions === 0 ? DefinitionStatus.NOT_DEFINED
        : DefinitionStatus.PARTLY_DEFINED;
  }

  /**
   * (Based on Blazewicz, Ecker et al. 2019 – Handbook on Scheduling, p. 274/353)
   *
   * @returns Dialog content informing that the current problem is exactly solvable in a realistic amount of time or undefined if not.
   */
  getMessageIfExactlySolvableProblem(): DialogContent | undefined {
    if (this.jobs.length
      && this.objectiveFunction === ObjectiveFunction.CYCLE_TIME
      && (this.nrOfMachines === 2 || this.isExacltySolvableThreeMachineFs())) {

      return new DialogContent(
        'Reihenfolgeproblem exakt lösbar',
        [
          // Can only be three or two when returned
          'Das aktuelle Reihenfolgeproblem (zu minimierende Gesamtbearbeitungszeit in Maschinenumgebung: ' +
          (this.machineConfigParam === MachineConfig.FLOWSHOP ? 'Flow Shop' : 'Job Shop') + ' mit ' +
          (this.nrOfMachines === 2 ? 'zwei' : 'drei') + ' Maschinen) ist mithilfe des Johnson-Algorithmus in Polynomialzeit exakt ' +
          'lösbar. Es besteht also kein Bedarf, ein heuristisches Verfahren zu verwenden.',
          this.nrOfMachines === 3 ? 'Normalerweise kann dieser Algorithmus nur für Zweimachinenprobleme verwendet werden. Im konkreten ' +
            'Falle stellt die mittlere Maschine allerdings keinen Flaschenhals dar (p1 < p2 < p3 oder p3 < p2 < p1), ' +
            'weswegen das exakte Verfahren dennoch anwendbar ist.' : ''
        ],
        DialogType.INFO
      );
    }
    return undefined;
  }

  /**
   * Checks whether a given heuristic is applicable in the current case and returns false/an informative dialog if not, if so true and
   * undefined respectively. Being applicable means:
   * - at least 4 configured jobs
   * - matching required machine configuration
   * - all values needed for calculating defined
   * - the current machine configuration allows to minimize the current objective function (using the given heuristic)
   *
   * @param definer Definer of the heuristic to be checked concerning being currently applicable or not
   * @param isDialogRequired (optional) If true, an informative dialog (if not applicable) or undefined will be
   *        returned instead of a boolean
   * @return True if a given heuristic is applicable in the current case, false if not. (if {isDialogRequired} is set to true, a
   *         dialog/undefined ist returned)
   */
  isHeuristicApplicable(definer: HeuristicDefiner, isDialogRequired?: boolean): boolean | DialogContent | undefined {
    // only schedule for at least four jobs:
    if (this.jobs.length >= 4) {
      const heuristic = Heuristic.getHeuristicByDefiner(definer);

      if (!heuristic.requiredMachineConfigs.includes(this.machineConfigParam)) {
        return isDialogRequired ? this.getNotApplicableDueToMachineConfigDialog(heuristic) : false;
      } else if (
        heuristic.heuristicDefiner !== HeuristicDefiner.PRIORITY_RULES
        && (!this.objectiveFunction || ![...heuristic.requiredValuesForObjectiveFunctions.keys()].includes(this.objectiveFunction))) {
        return isDialogRequired ? this.getNotApplicableDueToWrongOrMissingFunction(heuristic) : false;
      } else if (
        heuristic.machineConfigRequiresFunction &&
        heuristic.machineConfigRequiresFunction.get(this.machineConfigParam) &&
        !heuristic.machineConfigRequiresFunction.get(this.machineConfigParam).includes(this.objectiveFunction)) {
        return isDialogRequired ? this.getNotApplicableDueToMachineConfigRequiringFunctionDialog(heuristic) : false;
      } else {
        const missingValue = this.checkValuesForHeuristic(heuristic);
        const isApplicable = missingValue === undefined;
        if (isDialogRequired) {
          return isApplicable ? undefined : this.getNotApplicableDueToValueDialog(missingValue, heuristic);
        } else {
          return isApplicable;
        }
      }
    } else {
      return isDialogRequired ? new DialogContent(
        (this.jobs.length === 0 ? 'Keine' : 'Zu wenige') + ' Aufträge',
        ['Für das Visualisieren der Lösungsgüte von Heuristiken müssen mindestens vier Aufträge angelegt sein.',
          'Fügen Sie daher bitte ' + (this.jobs.length === 0 ? '' : 'weitere ') + 'Aufträge hinzu.'
        ],
        DialogType.ERROR)
        : false;
    }
  }

  /**
   * Checks whether all definable values needed in order to use a heuristic are defined.
   *
   * @param heuristic Heuristic the needed values for are to be checked
   * @returns undefined if no definition is missing, in case of a lacking definition
   *          type of the value at least one definition of is missing
   */
  private checkValuesForHeuristic(heuristic: Heuristic): DefinableValue | undefined {
    for (const value of heuristic.requiredValues) {
      if (this.getValueDefinitionStatus(value) !== DefinitionStatus.COMPLETELY_DEFINED) {
        return <DefinableValue>value;
      }
    }
    if (heuristic.requiredValuesForObjectiveFunctions) {
      for (const value of heuristic.requiredValuesForObjectiveFunctions.get(this.objectiveFunction)) {
        if (this.getValueDefinitionStatus(value) !== DefinitionStatus.COMPLETELY_DEFINED) {
          return <DefinableValue>value;
        }
      }
    }
    return undefined;
  }

  /**
   * @param heuristic Heuristic that cannot be applied due to the machine configuration
   * @returns Content for a dialog informing that the given heuristic is not applicable due to the machine configuration
   *          (naming both the needed and the current machine configuration)
   */
  private getNotApplicableDueToMachineConfigDialog(heuristic: Heuristic): DialogContent {
    const possibleMachineConfigs = [];
    heuristic.requiredMachineConfigs.forEach(config => {
      if (config === MachineConfig.FLOWSHOP) {
        possibleMachineConfigs.push('Flow Shop');
      } else if (config === MachineConfig.JOBSHOP) {
        possibleMachineConfigs.push('Job Shop');
      } else {
        possibleMachineConfigs.push('Eine Maschine');
      }
    });
    return new DialogContent(
      'Falsche Maschinenkonfiguration für ' + heuristic.name,
      [
        'Für die aktuelle Maschinenkonfiguration ist die gewählte Heuristik nicht passend.',
        'Bitte ändern Sie die Konfiguration zu' + (possibleMachineConfigs.length === 1 ?
          ': ' + possibleMachineConfigs[0] : ' einer der folgenden gelisteten: ')
      ],
      DialogType.ERROR,
      possibleMachineConfigs.length > 1 ? possibleMachineConfigs : undefined
    );
  }

  /**
   * @param heuristic Heuristic that cannot be applied due to the wrong/missing objective function to be minimized
   * @returns Content for a dialog informing that the given heuristic is not applicable due to a wrong/missing objective function to
   *          be minmized (naming both the needed and the currently selected objective function)
   */
  private getNotApplicableDueToWrongOrMissingFunction(heuristic: Heuristic): DialogContent {
    return new DialogContent(
      'Zielfunktionswert nicht passend',
      [
        'Das Reihenfolgeproblem kann derzeit nicht gelöst werden, da für das gewählte heuristische Verfahren (' +
        heuristic.name + ') nicht der richtige zu minimierende Zielfunktionswert vorliegt.',
        'Benötigt wird: \'' + [...heuristic.requiredValuesForObjectiveFunctions.keys()].join('\' oder \'') +
        '\', aktuell gewählt ist allerdings' +
        (this.objectiveFunction ? ': \'' + this.objectiveFunction + '\'.' : ' kein Zielfunktionswert.') +
        ' Bitte wählen Sie ' + ([...heuristic.requiredValuesForObjectiveFunctions.keys()].length > 1 ?
          'eine' : 'die') + ' gennnte Funktion, um fortfahren zu können.',
        'Das Lösen von Reihenfolgeproblemen mithilfe von Prioritätsregeln stellt hierbei eine Besonderheit dar, da ' +
        'durch die Wahl unterschiedlicher Regeln unterschiedliche Zielwerte betrachtet werden und diese frei kombinierbar sind.'
      ],
      DialogType.ERROR
    );
  }

  /**
   * @param heuristic Heuristic that cannot be applied due to the wrong objective function in the given machine configuration
   * @returns Content for a dialog informing that the given heuristic is not applicable due to the wrong objective function in the
   *          given machine configuration be minmized (naming both the possible (for current machine configuration) and
   *          the currently selected objective function(s))
   */
  private getNotApplicableDueToMachineConfigRequiringFunctionDialog(heuristic: Heuristic): DialogContent {
    return new DialogContent(
      'Zielfunktionswert nicht zu aktueller Maschinenkonfiguration passend',
      [
        'Das Reihenfolgeproblem kann derzeit nicht gelöst werden, da das gewählte heuristische Verfahren (' + heuristic.name +
        ') für die aktuelle Maschinenkonfiguration einen anderen zu minimierenden Zielfunktionswert ' +
        'voraussetzt (' + heuristic.machineConfigRequiresFunction.get(this.machineConfigParam).join(', ') +
        '), aktuell gewählt ist allerdings \'' + this.objectiveFunction + '\'.',
        'Bitte ändern Sie daher den Zielfunktionswert oder die Maschinenkonfiguration.'
      ],
      DialogType.ERROR
    );
  }

  /**
   * @param missingValue The currently missing value in order to be able to use the given heuristic
   * @param heuristic Heuristic that cannot be applied due to a missing value
   * @returns Content for a dialog informing that the given heuristic is not applicable due to a missing value which is specifically named
   */
  private getNotApplicableDueToValueDialog(missingValue: DefinableValue, heuristic: Heuristic): DialogContent {
    return new DialogContent(
      'Werte für Berechnung unvollständig',
      [
        'Das Reihenfolgeproblem kann derzeit nicht gelöst werden, da für das gewählte heuristische Verfahren (' +
        heuristic.name + ') nicht alle benötigten Werte vorliegen.',
        'Konkret handelt es sich dabei um ' + (this.getValueDefinitionStatus(missingValue) === DefinitionStatus.NOT_DEFINED
          ? '' : 'zum Teil ') + 'undefinierte ' + missingValue + '.',
        heuristic.requiredValuesForObjectiveFunctions &&
        heuristic.requiredValuesForObjectiveFunctions.get(this.objectiveFunction).includes(missingValue) ?
          'Dieser Wert wird nur aufgrund des gewählten Zielfunktionswerts benötigt. Für die Verwendung dieser Heuristik ' +
          'bei einem anderen zu minimierenden Zielfunktionswert (möglich sind: ' +
          [...heuristic.requiredValuesForObjectiveFunctions.keys()].filter(k => k !== this.objectiveFunction).join(', ') +
          ') ist dieser Wert ggf. nicht zu definieren.' : '',
        'Bitte sorgen Sie dafür, dass die genannten Werte vollständig sind, um fortfahren zu können.'
      ],
      DialogType.ERROR
    );
  }

  /**
   * @returns Total number of defined machine times defined for all jobs
   */
  private getJobTimesDefinitions(): number {
    let existingDefinitions = 0;
    this.jobs
      .map(job => job.machineTimes)
      .forEach(
        m => m.forEach(machine => {
          if (machine.timeOnMachine) {
            existingDefinitions++;
          }
        })
      );
    return existingDefinitions;
  }

  /**
   * @returns true if the machine order of each job is the same, false if not
   */
  private isSameMachineOrderForEachJob(): boolean {
    let lastCheckedIndex = 0;
    // cannot be undefined in this place
    const jobs = this.jobs;
    // last item has already been checked
    while (lastCheckedIndex < jobs.length - 1) {

      const jobMachines = jobs[lastCheckedIndex].machineTimes.map(
        machineTime => machineTime.machineNr
      );

      for (let i = 1 + lastCheckedIndex; i < jobs.length; i++) {
        const jobMachinesCompare = jobs[i].machineTimes.map(
          machineTime => machineTime.machineNr
        );
        // Arrays have same length, assured by design
        for (let j = 0; j < jobMachines.length; j++) {
          if (jobMachines[j] !== jobMachinesCompare[j]) {
            return false;
          }
        }
      }
      lastCheckedIndex++;
    }
    return true;
  }

  /**
   * @returns true in case of a Flow Shop problem with exactly three machines the second (middle machine) of is no bottleneck
   */
  private isExacltySolvableThreeMachineFs(): boolean {
    if (this.nrOfMachines === 3 && this.machineConfigParam === MachineConfig.FLOWSHOP) {
      const firstMachineMin = Math.min.apply(Math, this.jobs.map(job => job.machineTimes[0].timeOnMachine));
      const thirdMachineMin = Math.min.apply(Math, this.jobs.map(job => job.machineTimes[2].timeOnMachine));
      const secondMachineMax = Math.max.apply(Math, this.jobs.map(job => job.machineTimes[1].timeOnMachine));
      return firstMachineMin > secondMachineMax || thirdMachineMin > secondMachineMax;
    } else {
      return false;
    }
  }

  /**
   * @returns Current machine configuration (as formal/alpha param)
   */
  get machineConfigParam(): MachineConfig {
    if (!this.jobs || this.jobs.length === 0) {
      return MachineConfig.NONE;
    } else if (this.nrOfMachines === 1) {
      return MachineConfig.ONE_MACHINE;
    } else if (this.isSameMachineOrderForEachJob()) {
      return MachineConfig.FLOWSHOP;
    } else {
      return MachineConfig.JOBSHOP;
    }
  }

  /**
   * @returns Configured number of machines (default of 1 returned in case of no stored machine number)
   */
  get nrOfMachines(): number {
    if (!this._nrOfMachines) {
      const nrOfMachines = localStorage.getItem(this.PREFIX_KEY + this.NR_OF_MACHINES);
      this._nrOfMachines = nrOfMachines ? +nrOfMachines : 1;
    }
    return this._nrOfMachines;
  }

  /**
   * @param nrOfMachines Number of machines to be set both locally (for faster further usage in current session) and to be stored long term
   */
  set nrOfMachines(nrOfMachines: number) {
    this._nrOfMachines = nrOfMachines;
    localStorage.setItem(this.PREFIX_KEY + this.NR_OF_MACHINES, nrOfMachines.toString());
  }

  /**
   * @returns Configured jobs (empty array is returned as default in case of no stored jobs)
   */
  get jobs(): Job[] {
    if (!this._jobs) {
      const jobs = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.JOBS));
      this._jobs = jobs ? jobs : [];
    }
    return this._jobs;
  }

  /**
   * @param jobs Jobs to be set both locally (for faster further usage in current session) and to be stored long term
   */
  set jobs(jobs: Job[]) {
    this._jobs = jobs;
    localStorage.setItem(this.PREFIX_KEY + this.JOBS, JSON.stringify(jobs));
  }

  /**
   * @returns Configured objective function to be minimized (no default value to be returned in case of no stored value)
   */
  get objectiveFunction(): ObjectiveFunction {
    if (this._objectiveFunction === undefined) { // would be null if parsed from JSON
      this._objectiveFunction = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.OBJECTIVE_FUNCTION));
    }
    return this._objectiveFunction;
  }

  /**
   * @param value Objective function to be set both locally (for faster further usage in current session) and to be stored long term
   */
  set objectiveFunction(value: ObjectiveFunction) {
    this._objectiveFunction = value;
    localStorage.setItem(this.PREFIX_KEY + this.OBJECTIVE_FUNCTION, JSON.stringify(this.objectiveFunction));
  }

  /**
   * @returns Configured priority rules (empty array is returned as default in case of no stored priority rules)
   */
  get priorityRules(): PriorityRule[] {
    if (!this._priorityRules) {
      const priorityRules = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.PRIORITY_RULES));
      this._priorityRules = priorityRules ? priorityRules : [];
    }
    return this._priorityRules;
  }

  /**
   * @param priorityRules Priority rules to be set both locally (for faster further usage in current session) and to be stored long term
   */
  set priorityRules(priorityRules: PriorityRule[]) {
    this._priorityRules = priorityRules;
    localStorage.setItem(this.PREFIX_KEY + this.PRIORITY_RULES, JSON.stringify(priorityRules));
  }

  /**
   * @returns Current logging configuration (true is returned as default in case of no stored logging configuration)
   */
  get isLoggingConfigured(): boolean {
    if (this._isLoggingConfigured === undefined) {
      const isLoggingConfigured = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.IS_LOGGING));
      this._isLoggingConfigured = isLoggingConfigured !== null ? isLoggingConfigured : true;
    }
    return this._isLoggingConfigured;
  }

  /**
   * @param value Logging configuration to be set both locally (for faster further usage in current session) and to be stored long term
   */
  set isLoggingConfigured(value: boolean) {
    this._isLoggingConfigured = value;
    localStorage.setItem(this.PREFIX_KEY + this.IS_LOGGING, JSON.stringify(value));
  }
}
