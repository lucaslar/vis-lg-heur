export class OperationOnConsole {

  // TODO Add color as in timeline?

  // TODO Make private
  private readonly _machine: string;
  private readonly _job: string;
  private readonly _start: number;
  private readonly _end: number;
  private readonly _duration: number;

  constructor(row: (string | Date)[]) {
    this._machine = 'Maschine ' + (<string>row[0]).substr(1);
    this._job = <string>row[1];
    this._start = (<Date>row[2]).getMilliseconds();
    this._end = (<Date>row[3]).getMilliseconds();
    this._duration = this._end - this._start;
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

}
