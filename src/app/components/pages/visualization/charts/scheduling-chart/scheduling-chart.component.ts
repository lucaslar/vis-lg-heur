import {Component, Input, OnInit} from '@angular/core';
import {ChartType, Dataset} from '../../../../../model/internal/visualization/VisualizableData';

@Component({
  selector: 'app-scheduling-chart',
  templateUrl: './scheduling-chart.component.html',
  styleUrls: [
    './scheduling-chart.component.css',
    '../../../pages-styles.css',
    '../shared-chart-styles.css'
  ]
})

export class SchedulingChartComponent implements OnInit {

  /**
   * Further chart options
   */
  private _options;

  /**
   * Colors to be used for visualizing the dataset(s)
   */
  private _colors: Array<any>;

  /**
   * Title of the container/diagram
   */
  @Input() title: string;

  /**
   * Chart type
   */
  @Input() type: ChartType;

  /**
   * Datasets to be visualized
   */
  @Input() datasets: Dataset[];

  /**
   * Labels to be displayed
   */
  @Input() labels: string[];

  /**
   * Label for the x-axis
   */
  @Input() yLabel: string;

  /**
   * Label for the y-axis
   */
  @Input() xLabel: string;

  /**
   * Can be undefined due to other method.
   *
   * @param colors Colors to be set
   */
  @Input() set colors(colors: string[]) {
    this._colors = [
      {
        backgroundColor: colors
      }
    ];
  }


  /**
   * On initialization, options are initialized and color if not specified for the current diagram.
   */
  ngOnInit(): void {

    this.initOptions();

    if (!this._colors) {
      this.initDefaultColors();
    }
  }

  /**
   * Initialized the options concerning the diagram to be shown.
   */
  private initOptions(): void {
    this._options = {
      responsive: true,
      spanGaps: true,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          },
          scaleLabel: {
            display: true,
            labelString: this.yLabel
          }
        }],
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: this.xLabel
          }
        }]
      }
    };
  }

  /**
   * Initializes the specified default colors for bar/line charts.
   */
  private initDefaultColors(): void {
    this._colors = [
      { // Indigo accent (Angular Material) with less opacity:
        backgroundColor: this.type === ChartType.CJS_LINE ? 'rgba(255, 64, 119, .2)' : 'rgba(255, 64, 119, .8)',
        borderColor: 'rgba(255, 64, 119, .7)',
        borderWidth: this.type === ChartType.CJS_LINE ? 2 : 0
      }
    ];
  }

  get chartColors(): any[] {
    return this._colors;
  }

  get options() {
    return this._options;
  }

}
