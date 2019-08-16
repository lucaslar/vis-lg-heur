import {Input} from '@angular/core';

/**
 * Parent class for unifying specific classes implemented in order to simplify working with charts.
 */
export class VisualizableData {

  /**
   * Colors to be used in the chart
   */
  private _colors: string[];

  get colors(): string[] {
    return this._colors;
  }

  set colors(value: string[]) {
    this._colors = value;
  }
}

/**
 * Implemented in order to simplify working with Chart.js.
 */
export class ChartData extends VisualizableData {

  /**
   * Title of the diagram (container it is implemented in)
   */
  private _title: string;

  /**
   * Chart type
   */
  private _visualizableAs: ChartType;

  /**
   * Datasets to be visualized
   */
  private _datasets: Dataset[];

  /**
   * Labels to be displayed
   */
  private _labels: string[];

  /**
   * Label for the x-axis
   */
  private _xLabel: string;

  /**
   * Label for the y-axis
   */
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

/**
 * Implemented in order to simplify working with Google Timeline.
 */
export class TimelineData extends VisualizableData {

  /**
   * Machine, operation/job, start of operation, end of operation[]
   */
  private _timelineData: [string, string, Date, Date][];

  get timelineData(): [string, string, Date, Date][] {
    return this._timelineData;
  }

  set timelineData(value: [string, string, Date, Date][]) {
    this._timelineData = value;
  }
}

/**
 * Dataset used in Chart.js-diagrams
 */
export class Dataset {
  // Attributes cannot be private

  /**
   * Data to be displayed
   */
  data: number[];

  /**
   * Label of the current dataset
   */
  label: string;
}

/**
 * Chart.js: Types of charts that are implemented in this application.
 */
export enum ChartType {
  CJS_LINE = 'line',
  CJS_BAR = 'bar',
}
