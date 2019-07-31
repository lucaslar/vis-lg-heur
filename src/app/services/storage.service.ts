import {Injectable} from '@angular/core';
import {Job} from '../model/Job';
import {MachineConfig} from '../model/enums/MachineConfig';
import {DefinableValue} from '../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../model/internal/value-definition/DefinitionStatus';
import {PriorityRule} from '../model/enums/PriorityRule';
import {DialogContent} from '../model/internal/dialog/DialogContent';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {Heuristic} from '../model/Heuristic';
import {DialogType} from '../model/internal/dialog/DialogType';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private _jobs: Job[];
  private _nrOfMachines: number;
  private _objectiveFunction: ObjectiveFunction;
  private _priorityRules: PriorityRule[];

  private readonly PREFIX_KEY = 'VISLGHEUR_';
  private readonly JOBS = 'JOBS';
  private readonly NR_OF_MACHINES = 'NR_OF_MACHINES';
  private readonly OBJECTIVE_FUNCTION = 'OBJECTIVE_FUNCTION';
  private readonly PRIORITY_RULES = 'PRIORITY_RULES';

  getValueDefinitionStatus(definableValue: DefinableValue): DefinitionStatus {
    let expectedDefinitions: number;
    let existingDefinitions: number;

    if (definableValue === DefinableValue.ALPHA_JOB_TIMES) {
      expectedDefinitions = this.jobs.length * this.nrOfMachines;
      existingDefinitions = this.getJobTimesDefinitions();
    } else if (definableValue === DefinableValue.BETA_DUE_DATES) {
      expectedDefinitions = this.jobs.length;
      existingDefinitions = this.jobs.filter(job => job.dueDate).length;
    } else if (definableValue === DefinableValue.BETA_SETUP_TIMES && this.jobs.length) {
      expectedDefinitions = (this.jobs.length - 1) * this.jobs.length;
      existingDefinitions = this.jobs.map(job => job.setupTimesToOtherJobs ? job.setupTimesToOtherJobs
        .filter(setupTime => setupTime.duration !== undefined).length : 0).reduce((num1, num2) => num1 + num2);
    } else if (definableValue === DefinableValue.BETA_SETUP_TIMES && !this.jobs.length) {
      return DefinitionStatus.NOT_DEFINED;
    } else if (definableValue === DefinableValue.PRIORITY_RULES) {
      // Since not all rules have to be selected:
      return this.priorityRules.length ? DefinitionStatus.COMPLETELY_DEFINED : DefinitionStatus.NOT_DEFINED;
    } else {
      console.log('Define: ' + definableValue + '!');
    }

    return expectedDefinitions === existingDefinitions ? DefinitionStatus.COMPLETELY_DEFINED
      : existingDefinitions === 0 ? DefinitionStatus.NOT_DEFINED
        : DefinitionStatus.PARTLY_DEFINED;
  }

  getMessageIfExactlySolvableProblem(): DialogContent | undefined {

    // TODO: Implement case: Exactly solvable but more than 2 machines!
    // TODO Check Gamma after gamma being stored in StorageService.

    return this.nrOfMachines === 2 ?
      new DialogContent(
        'Reihenfolgeproblem exakt lösbar',
        [
          'Das aktuelle Reihenfolgeproblem (' + (this.machineConfigParam === MachineConfig.FLOWSHOP ?
            'Flowshop' : 'Jobshop') + ' mit zwei Maschinen) ist mithilfe des ' +
          'Johnson-Algorithmus in vertretbarer Zeit exakt lösbar.',
          'Der Rechenaufwand beträgt hierbei n log(n). Es besteht also kein Bedarf, ein ' +
          'heuristisches Verfahren zu verwenden.'
        ],
        DialogType.INFO
      ) : undefined;
  }

  isHeuristicApplicable(definer: HeuristicDefiner, isDialogRequired?: boolean): boolean | DialogContent | undefined {
    // only schedule for at least five jobs:
    if (this.jobs.length >= 5) {
      const heuristic = Heuristic.getHeuristicByDefiner(definer);

      if (!heuristic.requiredMachineConfigs.includes(this.machineConfigParam)) {
        return isDialogRequired ? this.getNotApplicableDueToMachineConfigDialog(heuristic) : false;
      } else {
        const missingValue = this.checkValuesForHeuristic(heuristic);
        const isApplicable = missingValue === undefined;
        // TODO: implement special case: due dates not defined for priority rules but no priority rules needs due dates
        if (isDialogRequired) {
          return isApplicable ? undefined : this.getNotApplicableDueToValueDialog(missingValue, heuristic.name);
        } else {
          return isApplicable;
        }
      }
    } else {
      return isDialogRequired ? new DialogContent(
        (this.jobs.length === 0 ? 'Keine' : 'Zu wenige') + ' Aufträge',
        ['Für das Visualisieren der Lösungsgüte von Heuristiken müssen mindestens fünf Aufträge angelegt sein.',
          'Fügen Sie daher bitte ' + (this.jobs.length === 0 ? '' : 'weitere ') + 'Aufträge hinzu.'
        ],
        DialogType.ERROR)
        : false;
    }
  }

  deleteUndefinedBetaValuesBlockingFunctions(isForced?: boolean): void {
    if (isForced || this.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) === DefinitionStatus.NOT_DEFINED) {
      this.jobs.forEach(job => job.setupTimesToOtherJobs = undefined);
      this.jobs = this.jobs;
    }
  }

  private checkValuesForHeuristic(heuristic: Heuristic): DefinableValue | undefined {
    for (const value of heuristic.requiredValues) {
      if (this.getValueDefinitionStatus(value) !== DefinitionStatus.COMPLETELY_DEFINED) {
        return <DefinableValue>value;
      }
    }
    return undefined;
  }

  private getNotApplicableDueToValueDialog(missingValue: DefinableValue, heuristicName: string): DialogContent {
    return new DialogContent(
      'Werte für Berechnung unvollständig',
      [
        'Das Reihenfolgeproblem kann derzeit nicht gelöst werden, da für das gewählte heuristische Verfahren (' +
        heuristicName + ') nicht alle benötigten Werte vorliegen.',
        'Konkret handelt es sich dabei um ' + (this.getValueDefinitionStatus(missingValue) === DefinitionStatus.NOT_DEFINED
          ? '' : 'zum Teil ') + 'undefinierte ' + missingValue + '.',
        'Bitte sorgen Sie dafür, dass die genannten Werte vollständig sind, um fortfahren zu können.'
      ],
      DialogType.ERROR
    );
  }

  private getNotApplicableDueToMachineConfigDialog(heuristic: Heuristic): DialogContent {
    const possibleMachineConfigs = [];
    heuristic.requiredMachineConfigs.forEach(config => {
      if (config === MachineConfig.FLOWSHOP) {
        possibleMachineConfigs.push('Flowshop');
      } else if (config === MachineConfig.JOBSHOP) {
        possibleMachineConfigs.push('Jobshop');
      } else {
        possibleMachineConfigs.push('Eine Maschine');
      }
    });

    // TODO Check machine nr, too.
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

  get nrOfMachines(): number {
    if (!this._nrOfMachines) {
      const nrOfMachines = localStorage.getItem(this.PREFIX_KEY + this.NR_OF_MACHINES);
      this._nrOfMachines = nrOfMachines ? +nrOfMachines : 1;
    }
    return this._nrOfMachines;
  }

  set nrOfMachines(nrOfMachines: number) {
    this._nrOfMachines = nrOfMachines;
    localStorage.setItem(this.PREFIX_KEY + this.NR_OF_MACHINES, nrOfMachines.toString());
  }

  get jobs(): Job[] {
    if (!this._jobs) {
      const jobs = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.JOBS));
      this._jobs = jobs ? jobs : [];
    }
    return this._jobs;
  }

  set jobs(jobs: Job[]) {
    this._jobs = jobs;
    localStorage.setItem(this.PREFIX_KEY + this.JOBS, JSON.stringify(jobs));
  }

  get objectiveFunction(): ObjectiveFunction {
    if (this._objectiveFunction === undefined) { // would be null if parsed from JSON
      this._objectiveFunction = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.OBJECTIVE_FUNCTION));
    }
    return this._objectiveFunction;
  }

  set objectiveFunction(value: ObjectiveFunction) {
    this._objectiveFunction = value;
    localStorage.setItem(this.PREFIX_KEY + this.OBJECTIVE_FUNCTION, JSON.stringify(this.objectiveFunction));
  }

  get priorityRules(): PriorityRule[] {
    if (!this._priorityRules) {
      const priorityRules = JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.PRIORITY_RULES));
      this._priorityRules = priorityRules ? priorityRules : [];
    }
    return this._priorityRules;
  }

  set priorityRules(priorityRules: PriorityRule[]) {
    this._priorityRules = priorityRules;
    localStorage.setItem(this.PREFIX_KEY + this.PRIORITY_RULES, JSON.stringify(priorityRules));
  }
}
