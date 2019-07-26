export class VisualizableData {

  // TODO Make private
  title: string;
  visualizableAs: ChartType;

}

export class ChartData extends VisualizableData {
  // set for visualizableAs only here
  datasets: Dataset[];
  labels: string[];
}

export class TimelineData extends VisualizableData {
  timelineData: [string, Date, Date][];

  constructor() {
    super();
    super.visualizableAs = ChartType.GC_TIMELINE;
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

// GOOGle Charts types:
  GC_TIMELINE = 'Timeline'
}
