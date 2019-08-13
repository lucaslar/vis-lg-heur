export class OperationOnConsole {

  private readonly _machine: string;
  private readonly _job: string;
  private readonly _start: number;
  private readonly _end: number;
  private readonly _duration: number;
  private readonly _color: string;

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