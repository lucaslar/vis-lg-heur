import {ScheduledJob} from './ScheduledJob';

export class Machine {

  // Only to be used for Nearest Neighbour heuristic
  private _isCurrentlySettingUp: boolean;

  private readonly _machineNr: number;
  private _jobQueue: ScheduledJob[];
  private _currentJob: ScheduledJob;
  private _lastJob: ScheduledJob;

  constructor(machineNr: number) {
    this._machineNr = machineNr;
    this._jobQueue = [];
  }

  freeIfCurrentJobOperationFinished(timestamp: number): void {
    // if timestamp equals finishing date of job's last operation
    if (timestamp === this.currentJob.operationsOnMachines[this.currentJob.operationsOnMachines.length - 1].finishTimestamp) {
      this.currentJob.onOperationFinished();
      this._lastJob = this.currentJob;
      this._currentJob = undefined;
    }
  }

  startProductionOfNext(timestamp: number): void {
    this._currentJob = this.jobQueue[0];
    this._currentJob.onNextOperationStarted(timestamp);
    this.jobQueue = this.jobQueue.filter(job => job !== this.currentJob);
  }

  // Only to be called for Nearest Neighbour heuristic
  isMachineSetup(timestamp: number): boolean {
    return this._isCurrentlySettingUp = !this.lastJob || timestamp >= this.lastJob.finishedAtTimestamp +
      this.lastJob.setupTimesToOtherJobs.find(sT => sT.idTo === this.jobQueue[0].id).duration;
  }

  get machineNr(): number {
    return this._machineNr;
  }

  get jobQueue(): ScheduledJob[] {
    return this._jobQueue;
  }

  set jobQueue(jobQueue: ScheduledJob[]) {
    this._jobQueue = jobQueue;
  }

  get currentJob(): ScheduledJob {
    return this._currentJob;
  }

  get lastJob(): ScheduledJob {
    return this._lastJob;
  }
}
