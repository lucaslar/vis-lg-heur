export class BottleneckRelation {

  private _machineNr: number;
  private _jobId: number;
  private _nextElements: BottleneckRelation[];

  get machineNr(): number {
    return this._machineNr;
  }

  set machineNr(value: number) {
    this._machineNr = value;
  }

  get jobId(): number {
    return this._jobId;
  }

  set jobId(value: number) {
    this._jobId = value;
  }

  get nextElements(): BottleneckRelation[] {
    return this._nextElements;
  }

  set nextElements(value: BottleneckRelation[]) {
    this._nextElements = value;
  }
}
