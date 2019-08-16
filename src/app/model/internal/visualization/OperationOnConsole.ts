/**
 * Used to display selected operations of a job on certain machines below the Gantt-chart.
 */
export class OperationOnConsole {

  /**
   * Machine of the operation
   */
  private readonly _machine: string;

  /**
   * Job the operation belongs to
   */
  private readonly _job: string;

  /**
   * Starting timestamp of the operation
   */
  private readonly _start: number;

  /**
   * Ending timestamp of the operation
   */
  private readonly _end: number;

  /**
   * Duration of the operation
   */
  private readonly _duration: number;

  /**
   * Job-related color for displaying the given information
   */
  private readonly _color: string;

  /**
   * @param row Row as specified for Timeline Charts
   * @param color Job-related color for displaying the given information
   */
  constructor(row: (string | Date)[], color: string) {
    this._machine = 'Maschine ' + (<string>row[0]).substr(1);
    this._job = <string>row[1];
    this._start = +(<Date>row[2]);
    this._end = +(<Date>row[3]);
    this._duration = this._end - this._start;
    this._color = color;
  }

  get machine(): string {
    return this._machine;
  }

  get job(): string {
    return this._job;
  }

  get start(): number {
    return this._start;
  }

  get end(): number {
    return this._end;
  }

  get duration(): number {
    return this._duration;
  }

  get color(): string {
    return this._color;
  }
}
