import {Job} from './Job';

export class ScheduledJob extends Job {

  private readonly _operationsOnMachines: OperationOnMachine[] = [];
  private finishedOperationsCounter;

  constructor(job: Job) {
    super(job.name);
    this.id = job.id;
    this.machineTimes = job.machineTimes;
    this.dueDate = job.dueDate;
    this.setupTimesToOtherJobs = job.setupTimesToOtherJobs;
    this.finishedOperationsCounter = 0;
  }

  onNextOperationStarted(timestamp: number): void {
    this._operationsOnMachines.push(new OperationOnMachine(
      this.nextMachineNr,
      timestamp,
      this.machineTimes[this.finishedOperationsCounter].timeOnMachine
    ));
  }

  onOperationFinished(): void {
    this.finishedOperationsCounter++;
  }

  getSlackTimeForTimestamp(timestamp: number): number {
    return this.getRemainingTimeForTimestamp(timestamp) - this.getRemainingMachiningTime();
  }

  getCriticalRatioOrProcessingTimeForTimestamp(timestamp: number): number {
    if (this.getSlackTimeForTimestamp(timestamp) > 0) {
      return this.getCriticalValueForTimestamp(timestamp);
    } else {
      return this.currentProcessingTime;
    }
  }

  getModifiedOperationalDueDateForTimestamp(timestamp: number): number {
    const set = this.getSoonestEndingTime(timestamp);
    const tCorner = this.getTCornerForTimestamp(timestamp);
    return Math.max(set, tCorner);
  }

  getCriticalValueForTimestamp(timestamp: number) {
    const rt = this.getRemainingTimeForTimestamp(timestamp);
    const rmt = this.getRemainingMachiningTime();
    return rt / rmt;
  }

  getSoptForTimestamp(timestamp: number): number {
    const st = this.getSlackTimeForTimestamp(timestamp);
    const rmt = this.getRemainingMachiningTime();
    return st / rmt;
  }

  getSopnForTimestamp(timestamp: number): number {
    const st = this.getSlackTimeForTimestamp(timestamp);
    const remainingOps = this.getRemainingOperations();
    return st / remainingOps;
  }

  getSpttForTimestamp(timestamp: number): number {
    const cot = this.currentProcessingTime;
    const r = 99; // TODO: Discuss: which weight? r <-> sopn
    return Math.min(cot + r, this.getSopnForTimestamp(timestamp));
  }

  getSoonestEndingTime(timestamp: number): number {
    const av = this.getJobAvailabilityForTimestamp(timestamp);
    const mv = this.getMachineAvailability();
    return Math.max(av, mv) + this.currentProcessingTime;
  }

  getTCornerForTimestamp(timestamp: number): number {
    const av = this.getJobAvailabilityForTimestamp(timestamp);
    const ff = (this.dueDate - av) / this.getRemainingMachiningTime();
    const cot = this.currentProcessingTime;
    return av + Math.max(cot, cot * ff);
  }

  private getRemainingTimeForTimestamp(timestamp: number): number {
    return this.dueDate - timestamp;
  }

  private getRemainingOperations(): number {
    return this.machineTimes.length - this.finishedOperationsCounter;
  }

  private getMachineAvailability(): number {
    // TODO: MV = Verfügbarkeit an Station j? Immer 1 oder 0?
    return 0;
  }

  private getJobAvailabilityForTimestamp(timestamp: number): number {
    // Herrmann: no finished operation = soonest starting time = now (soonest possible)
    return this.operationsOnMachines.length > 0 ?
      this.operationsOnMachines[this.operationsOnMachines.length - 1].finishTimestamp : timestamp;
  }

  private getRemainingMachiningTime(): number {
    let remainingMachiningTime = 0;
    for (let i = this.finishedOperationsCounter; i < this.machineTimes.length; i++) {
      remainingMachiningTime += this.machineTimes[i].timeOnMachine;
    }
    return remainingMachiningTime;
  }

  get slipTime(): number {
    return this.dueDate - this.getRemainingMachiningTime();
  }

  get currentProcessingTime(): number | undefined {
    return this.machineTimes[this.finishedOperationsCounter].timeOnMachine;
  }

  // End of values needed for priority rules

  get nextMachineNr(): number | undefined {
    // undefined means the order is finished and has no next machine
    return this.finishedOperationsCounter === this.machineTimes.length ?
      undefined : this.machineTimes[this.finishedOperationsCounter].machineNr;
  }

  get operationsOnMachines(): OperationOnMachine[] {
    return this._operationsOnMachines;
  }

  get finishedAtTimestamp(): number | undefined {
    // undefined as return value means the order is not finished yet.
    return this.nextMachineNr !== undefined ?
      undefined : this.operationsOnMachines[this.finishedOperationsCounter - 1].finishTimestamp;
  }

  get delay(): number | undefined {
    // Undefined if not yet finished or no due date specified
    return this.nextMachineNr !== undefined || !this.dueDate ?
      undefined :
      // no delay if finished before due date
      this.finishedAtTimestamp <= this.dueDate ? 0 :
        this.finishedAtTimestamp - this.dueDate;
  }

  get totalMachiningTime(): number {
    return this.machineTimes.map(m => m.timeOnMachine).reduce((m1, m2) => m1 + m2);
  }

}

export class OperationOnMachine {

  private readonly _machineNr: number;
  private readonly _startTimestamp: number;
  private readonly _finishTimestamp: number;

  constructor(machineNr: number, startTimestamp: number, duration: number) {
    this._machineNr = machineNr;
    this._startTimestamp = startTimestamp;
    this._finishTimestamp = duration + startTimestamp;
  }

  get machineNr(): number {
    return this._machineNr;
  }

  get startTimestamp(): number {
    return this._startTimestamp;
  }

  get finishTimestamp(): number {
    return this._finishTimestamp;
  }
}
