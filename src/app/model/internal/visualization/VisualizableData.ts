export class VisualizableData {
  private _colors: string[];

  get colors(): string[] {
    return this._colors;
  }

  set colors(value: string[]) {
    this._colors = value;
  }
}

export class ChartData extends VisualizableData {
  private _title: string;
  private _visualizableAs: ChartType;
  private _datasets: Dataset[];
  private _labels: string[];
  private _xLabel: string;
  private _yLabel: string;

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

  get xLabel(): string {
    return this._xLabel;
  }

  set xLabel(value: string) {
    this._xLabel = value;
  }

  get yLabel(): string {
    return this._yLabel;
  }

  set yLabel(value: string) {
    this._yLabel = value;
  }
}

export class TimelineData extends VisualizableData {
  private _timelineData: [string, string, Date, Date][];

  get timelineData(): [string, string, Date, Date][] {
    return this._timelineData;
  }

  set timelineData(value: [string, string, Date, Date][]) {
    this._timelineData = value;
  }
}

export class Dataset {
  data: number[];
  label: string;
}

export enum ChartType {
  // Chart.js types:
  CJS_LINE = 'line',
  CJS_BAR = 'bar',
}
