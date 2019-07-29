import {Component, Input, OnInit} from '@angular/core';
import {ChartType, Dataset} from '../../../../../model/internal/visualization/VisualizableData';

@Component({
  selector: 'app-chart',
  templateUrl: './scheduling-chart.component.html',
  styleUrls: [
    './scheduling-chart.component.css',
    '../../../pages-styles.css',
    '../shared-chart-styles.css'
  ]
})

export class SchedulingChartComponent implements OnInit {

  private _options;
  private _colors: Array<any>;

  @Input() title: string;
  @Input() type: ChartType;
  @Input() datasets: Dataset[];
  @Input() labels: string[];
  @Input() yLabel: string;
  @Input() xLabel: string;

  @Input() set colors(colors: string[]) {
    this._colors = [
      {
        backgroundColor: colors
      }
    ];
  }


  ngOnInit(): void {

    this.initOptions();

    if (!this._colors) {
      this.initDefaultColors();
    }
  }

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
