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

  private readonly lineChartColor: Array<any> = [
    {
      backgroundColor: 'rgba(105, 0, 132, .2)',
      borderColor: 'rgba(200, 99, 132, .7)',
      borderWidth: 2,
    }
  ];

  ngOnInit(): void {
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

  get chartColors(): any[] {
    if (this._colors) {
      return this._colors;
    } else if (this.type === ChartType.CJS_LINE) {
      return this.lineChartColor;
    }
  }

  get options() {
    return this._options;
  }

}
