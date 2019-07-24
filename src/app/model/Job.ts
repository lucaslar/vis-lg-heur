export class Job {

  id: number;
  name: string;
  machineTimes: MachineTimeForJob[];
  dueDate: number;

  constructor(_name: string) {
    this.name = _name;
  }
}

export class MachineTimeForJob {

  machineNr: number;
  timeOnMachine: number;

  constructor(machineNr: number, timeOnMachine?: number) {
    this.machineNr = machineNr;
    this.timeOnMachine = timeOnMachine;
  }

}
