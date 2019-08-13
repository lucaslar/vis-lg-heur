import {RelaxableOneMachineScheduledJob} from './ScheduledJob';

export class SchedulingPlanForMachine {

  private readonly _machineNr: number;
  private _scheduledJobs: RelaxableOneMachineScheduledJob[];

  constructor(machineNr: number, scheduledJobs: RelaxableOneMachineScheduledJob[]) {
    this._machineNr = machineNr;
    this._scheduledJobs = scheduledJobs;
  }

  get machineNr(): number {
    return this._machineNr;
  }

  get scheduledJobs(): RelaxableOneMachineScheduledJob[] {
    return this._scheduledJobs;
  }

  set scheduledJobs(value: RelaxableOneMachineScheduledJob[]) {
    this._scheduledJobs = value;
  }
}
