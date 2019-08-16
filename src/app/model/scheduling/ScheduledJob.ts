import {Job} from './Job';

/**
 * Internal implementation of a job. Extends the job the user has access to.
 */
export class ScheduledJob extends Job {

  /**
   * Starting and ending time of tasks on certain machines
   */
  private readonly _operationsOnMachines: OperationOnMachine[] = [];

  /**
   * Number of finished operations (used for dynamic scheduling)
   */
  private finishedOperationsCounter;

  /**
   * @param job Job this scheduled job should be based on
   */
  constructor(job: Job) {
    super(job.name);
    this.id = job.id;
    this.machineTimes = job.machineTimes;
    this.dueDate = job.dueDate;
    this.setupTimesToOtherJobs = job.setupTimesToOtherJobs;
    this.weight = job.weight;
    this.finishedOperationsCounter = 0;
  }

  /**
   * Adds the current/new operation to the list of operations.
   *
   * @param timestamp Timestamp the operation started
   */
  onNextOperationStarted(timestamp: number): void {
    this._operationsOnMachines.push(new OperationOnMachine(
      this.nextMachineNr,
      timestamp,
      this.machineTimes[this.finishedOperationsCounter].timeOnMachine
    ));
  }

  /**
   * Counts up the {finishedOperationsCounter} as another operation has finished
   */
  onOperationFinished(): void {
    this.finishedOperationsCounter++;
  }

  /**
   * @param machineNr First machine number to be excluded
   * @returns Sum of times for tasks before the given machine
   */
  getMachiningTimeBeforeStepOnMachine(machineNr: number): number {
    let time = 0;
    const indexOfMachine = this.machineTimes.indexOf(this.machineTimes.find(mt => mt.machineNr === machineNr));
    for (let i = 0; i < indexOfMachine; i++) {
      time += this.machineTimes[i].timeOnMachine;
    }
    return time;
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Slack time for the given timestamp
   */
  getSlackTimeForTimestamp(timestamp: number): number {
    return this.getRemainingTimeForTimestamp(timestamp) - this.getRemainingMachiningTime();
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Critical value for the given timestamp
   */
  getCriticalRatioOrProcessingTimeForTimestamp(timestamp: number): number {
    if (this.getSlackTimeForTimestamp(timestamp) > 0) {
      return this.getCriticalValueForTimestamp(timestamp);
    } else {
      return this.currentProcessingTime;
    }
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Modified operational due date for the given timestamp
   */
  getModifiedOperationalDueDateForTimestamp(timestamp: number): number {
    const set = this.getSoonestEndingTime(timestamp);
    const tCorner = this.getTCornerForTimestamp(timestamp);
    return Math.max(set, tCorner);
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Critical value for timestamp
   */
  getCriticalValueForTimestamp(timestamp: number) {
    const rt = this.getRemainingTimeForTimestamp(timestamp);
    const rmt = this.getRemainingMachiningTime();
    return rt / rmt;
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Slack time / remaining machining time
   */
  getSoptForTimestamp(timestamp: number): number {
    const st = this.getSlackTimeForTimestamp(timestamp);
    const rmt = this.getRemainingMachiningTime();
    return st / rmt;
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Slack time / remaining operations
   */
  getSopnForTimestamp(timestamp: number): number {
    const st = this.getSlackTimeForTimestamp(timestamp);
    const remainingOps = this.getRemainingOperations();
    return st / remainingOps;
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns Minimum of: current processing time + 10 or value for SOPN
   */
  getSpttForTimestamp(timestamp: number): number {
    const cot = this.currentProcessingTime;
    const r = 10;
    return Math.min(cot + r, this.getSopnForTimestamp(timestamp));
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   * Comment: Implemented ignoring machine availability (see thesis)
   *
   * @param timestamp Current timestamp
   * @returns Soonest ending time
   */
  getSoonestEndingTime(timestamp: number): number {
    const av = this.getJobAvailabilityForTimestamp(timestamp);
    // Machine availability does not make sense with the limited given data of this application
    // const mv = this.getMachineAvailability();
    // return Math.max(av, mv) + this.currentProcessingTime;
    return av + this.currentProcessingTime;
  }

  /**
   * See: Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018)
   *
   * @param timestamp Current timestamp
   * @returns T-Corner
   */
  getTCornerForTimestamp(timestamp: number): number {
    const av = this.getJobAvailabilityForTimestamp(timestamp);
    const ff = (this.dueDate - av) / this.getRemainingMachiningTime();
    const cot = this.currentProcessingTime;
    return av + Math.max(cot, cot * ff);
  }

  /**
   * @param timestamp Current timestamp
   * @returns Remaining time until due date
   */
  private getRemainingTimeForTimestamp(timestamp: number): number {
    return this.dueDate - timestamp;
  }

  /**
   * @returns Number of remaining operations
   */
  private getRemainingOperations(): number {
    return this.machineTimes.length - this.finishedOperationsCounter;
  }

  /**
   * @param timestamp Current timestamp
   * @returns Current timestamp or in case of a finished operation before this operation its finishing timestamp
   */
  private getJobAvailabilityForTimestamp(timestamp: number): number {
    // Herrmann: no finished operation = soonest starting time = now (soonest possible)
    return this.operationsOnMachines.length > 0 ?
      this.operationsOnMachines[this.operationsOnMachines.length - 1].finishTimestamp : timestamp;
  }

  /**
   * @returns Total remaining time until job is finished
   */
  private getRemainingMachiningTime(): number {
    let remainingMachiningTime = 0;
    for (let i = this.finishedOperationsCounter; i < this.machineTimes.length; i++) {
      remainingMachiningTime += this.machineTimes[i].timeOnMachine;
    }
    return remainingMachiningTime;
  }

  /**
   * Own implementation
   *
   * @returns Slip time (due date - remaining machining time)
   */
  get slipTime(): number {
    return this.dueDate - this.getRemainingMachiningTime();
  }

  /**
   * @returns Current processing time or undefined
   */
  get currentProcessingTime(): number | undefined {
    return this.machineTimes[this.finishedOperationsCounter].timeOnMachine;
  }

  /**
   * @returns Number of the next machine or undefined if the job is finished and has no next machine
   */
  get nextMachineNr(): number | undefined {
    return this.finishedOperationsCounter === this.machineTimes.length ?
      undefined : this.machineTimes[this.finishedOperationsCounter].machineNr;
  }

  /**
   * @returns Finishing timestamp or undefined if still not finished
   */
  get finishedAtTimestamp(): number | undefined {
    return this.nextMachineNr !== undefined ?
      undefined : this.operationsOnMachines[this.finishedOperationsCounter - 1].finishTimestamp;
  }

  /**
   * @returns Delay or undefined if the job is not finished yet
   */
  get delay(): number | undefined {
    // Undefined if not yet finished or no due date specified
    return this.nextMachineNr !== undefined || !this.dueDate ?
      undefined :
      // no delay if finished before due date
      this.finishedAtTimestamp <= this.dueDate ? 0 :
        this.finishedAtTimestamp - this.dueDate;
  }

  /**
   * @returns Sum of all operation times
   */
  get totalMachiningTime(): number {
    return this.machineTimes.map(m => m.timeOnMachine).reduce((m1, m2) => m1 + m2);
  }

  get operationsOnMachines(): OperationOnMachine[] {
    return this._operationsOnMachines;
  }

}

/**
 * This class expands {ScheduledJob} by the possibility to pause jobs in production which is needed in order to solve scheduling problems
 * with the Branch and Bound algorithm/Shifting-Bottleneck-Heuristic. It's build in order to solve the
 * 1 | rj | Lmax problem ( -> implemented job availability and on machine due date)
 */
export class RelaxableOneMachineScheduledJob extends ScheduledJob {

  /**
   *  Machining time on a given machine
   */
  private readonly _onMachineOperationTime: number;

  /**
   * Earliest availability on the given machine
   */
  private _onMachineAvailability: number;

  /**
   * Due date caused by precedence constraints
   */
  private _onMachineDueDate: number;


  /**
   * Remaining (pausable) production time
   */
  private remainingProductionTime: number;

  /**
   * Delay on given machine
   */
  private _onMachineDelay: number;

  /**
   * @param job Job this relaxable job should be based on
   * @param observedMachineNr Machine number the one Machine problem is solved for
   * @param currentLowerBound lower bound for calculating due date
   */
  constructor(job: Job, observedMachineNr: number, currentLowerBound: number) {
    super(job);
    this._onMachineOperationTime = this.machineTimes.find(mt => mt.machineNr === observedMachineNr).timeOnMachine;
    this._onMachineAvailability = this.getMachiningTimeBeforeStepOnMachine(observedMachineNr);
    this._onMachineDueDate = currentLowerBound -
      (this.totalMachiningTime - this.onMachineOperationTime - this.onMachineAvailability);
  }

  /**
   * (Re)sets the remaining production time and thus the possibility to of relaxable scheduling
   */
  initializeRelaxedProduction(): void {
    this.remainingProductionTime = this.onMachineOperationTime;
  }

  /**
   * Decrements the remaining production time and if calculates the on machine delay if finished.
   *
   * @param timestamp Current timestamp
   */
  proceedProducing(timestamp: number): void {
    this.remainingProductionTime--;
    if (this.isRelaxedProductionFinished) {
      this._onMachineDelay = (timestamp + 1) - this.onMachineDueDate;
    }
  }

  /**
   * @returns true in case of no remaining production time
   */
  get isRelaxedProductionFinished(): boolean {
    return this.remainingProductionTime === 0;
  }

  get onMachineOperationTime(): number {
    return this._onMachineOperationTime;
  }

  get onMachineAvailability(): number {
    return this._onMachineAvailability;
  }

  set onMachineAvailability(value: number) {
    this._onMachineAvailability = value;
  }

  get onMachineDueDate(): number {
    return this._onMachineDueDate;
  }

  set onMachineDueDate(value: number) {
    this._onMachineDueDate = value;
  }

  get onMachineDelay(): number {
    return this._onMachineDelay;
  }
}

export class OperationOnMachine {

  /**
   * Number of the processing machine
   */
  private readonly _machineNr: number;

  /**
   * Timestamp of beginning the operation
   */
  private readonly _startTimestamp: number;

  /**
   * Timestamp of ending the operation
   */
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
