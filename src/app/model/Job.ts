export class Job {

  // TODO Can this be private?

  id: number;
  name: string;
  machineTimes: MachineTimeForJob[];
  dueDate: number;
  setupTimesToOtherJobs: SetupTime[];

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

export class SetupTime {

  idTo: number;
  duration: number;

  constructor(idTo: number) {
    this.idTo = idTo;
  }
}
