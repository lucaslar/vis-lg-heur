import {Injectable} from '@angular/core';
import {Job} from '../model/Job';
import {MachineConfig} from '../model/MachineConfig';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly PREFIX_KEY = 'VISLGHEUR_';
  private readonly NR_OF_MACHINES = 'NR_OF_MACHINES';
  private readonly JOBS = 'JOBS';

  get nrOfMachines(): number {
    return +localStorage.getItem(this.PREFIX_KEY + this.NR_OF_MACHINES);
  }

  set nrOfMachines(nrOfMachines: number) {
    localStorage.setItem(this.PREFIX_KEY + this.NR_OF_MACHINES, nrOfMachines.toString());
  }

  get jobs(): Job[] {
    return JSON.parse(localStorage.getItem(this.PREFIX_KEY + this.JOBS));
  }

  set jobs(jobs: Job[]) {
    localStorage.setItem(this.PREFIX_KEY + this.JOBS, JSON.stringify(jobs));
  }

  get machineConfigParam(): MachineConfig {
    if (this.jobs.length === 0) {
      return MachineConfig.NONE;
    } else if (this.nrOfMachines === 1) {
      return MachineConfig.ONE_MACHINE;
    } else if (this.isSameMachineOrderForEachJob()) {
      return MachineConfig.FLOWSHOP;
    } else {
      return MachineConfig.JOBSHOP;
    }
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

}
