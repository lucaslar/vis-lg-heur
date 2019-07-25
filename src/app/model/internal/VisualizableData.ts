export class VisualizableData {

  private _title: string;
  private _visualizableAs: ChartType;
  private _datasets: Dataset[];
  private _labels: string[];

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  get visualizableAs(): ChartType {
    return this._visualizableAs;
  }

  set visualizableAs(value: ChartType) {
    this._visualizableAs = value;
  }

  get datasets(): Dataset[] {
    return this._datasets;
  }

  set datasets(value: Dataset[]) {
    this._datasets = value;
  }

  get labels(): string[] {
    return this._labels;
  }

  set labels(value: string[]) {
    this._labels = value;
  }
}

export class Dataset {
  data: number[];
  label: string;
}

export enum ChartType {
  BAR = 'bar',
  DOUGHNUT = 'doughnut',
  LINE = 'line'
}
