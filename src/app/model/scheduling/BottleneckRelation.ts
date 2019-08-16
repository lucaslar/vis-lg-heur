/**
 * Class used in order to define a node/precedence constraints.
 */
export class BottleneckRelation {

  /**
   * Machine number of the current node
   */
  private _machineNr: number;

  /**
   * Job Id of the current node
   */
  private _jobId: number;

  /**
   * Precedence constraints to other nodes
   */
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
