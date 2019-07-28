export class VisualizableData {

  // TODO Make private
  title: string;

}

export class ChartData extends VisualizableData {
  // set for visualizableAs only here
  visualizableAs: ChartType;
  datasets: Dataset[];
  labels: string[];
  xLabel: string;
  yLabel: string;
  colors: string[];
}

// TODO: Only chart js as object? (title not needed either)

export class TimelineData extends VisualizableData {
  timelineData: [string, string, Date, Date][];
  colors: string[];
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
