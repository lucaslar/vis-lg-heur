import {RelaxableOneMachineScheduledJob} from './ScheduledJob';

/**
 * Fixed scheduling plan to be used for a single machine.
 */
export class SchedulingPlanForMachine {

  /**
   * Number of the machine this plan refers to
   */
  private readonly _machineNr: number;

  /**
   * Jobs in correct order
   */
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
