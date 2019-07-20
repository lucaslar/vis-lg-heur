export class Job {
  // TODO: Make private

  id: number;
  name: string;
  machineTimes: MachineTimeForJob[];

  constructor(_name: string) {
    this.name = _name;
  }

}

export class MachineTimeForJob {

  // TODO: Make private
  machineNr: number;
  timeOnMachine: number;

  constructor(machineNr: number, timeOnMachine: number) {
    this.machineNr = machineNr;
    this.timeOnMachine = timeOnMachine;
  }

}
