import {Injectable} from '@angular/core';
import {Job} from '../model/Job';
import {MachineConfig} from '../model/enums/MachineConfig';
import {DefinableValue} from '../model/internal/DefinableValue';
import {DefinitionStatus} from '../model/internal/DefinitionStatus';
import {PriorityRule} from '../model/enums/PriorityRule';
import {DialogContent} from '../model/internal/DialogContent';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {Heuristic} from '../model/Heuristic';
import {DialogType} from '../model/internal/DialogType';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private _jobs: Job[];
  private _nrOfMachines: number;
  private _priorityRules: PriorityRule[];

  private readonly PREFIX_KEY = 'VISLGHEUR_';
  private readonly NR_OF_MACHINES = 'NR_OF_MACHINES';
  private readonly JOBS = 'JOBS';
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
    } else if (definableValue === DefinableValue.PRIORITY_RULES) {
      // Since not all rules have to be selected:
      return this.priorityRules.length ?
        DefinitionStatus.COMPLETELY_DEFINED : DefinitionStatus.NOT_DEFINED;
    } else {
      console.log('Define: ' + definableValue + '!');
    }

    return expectedDefinitions === existingDefinitions ? DefinitionStatus.COMPLETELY_DEFINED
      : existingDefinitions === 0 ? DefinitionStatus.NOT_DEFINED
        : DefinitionStatus.PARTLY_DEFINED;
  }

  isHeuristicApplicableAndSet(definer: HeuristicDefiner, isDialogRequired?: boolean): boolean | DialogContent | undefined {
    // only schedule for at least five jobs:
    if (this.jobs.length >= 5) {
      let isApplicable = false;
      const heuristic = Heuristic.getHeuristicByDefiner(definer);
      /*
      return new DialogContent(
        'Header',
        ['Text'],
        DialogType.ERROR
      );
      */
      return isApplicable;
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
