import {Component, Input} from '@angular/core';
import {ChartType, Dataset} from '../../../../../model/internal/VisualizableData';

@Component({
  selector: 'app-chart',
  templateUrl: './scheduling-chart.component.html',
  styleUrls: [
    './scheduling-chart.component.css',
    '../../../pages-styles.css',
    '../shared-chart-styles.css'
  ]
})

export class SchedulingChartComponent {

  // TODO: Set relation for x axis in line charts

  // TODO: One color for all machines?
  // TODO: Same colors as in Google Chart for jobs?

  @Input() title: string;
  @Input() type: ChartType;
  @Input() datasets: Dataset[];
  @Input() labels: string[];

  readonly options = {
    responsive: true,
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  };

  // TODO Add more / repeatable?
  private readonly barChartColors: Array<any> = [
    {
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)'
      ],
    }
  ];

  private readonly lineChartColor: Array<any> = [
    {
      backgroundColor: 'rgba(105, 0, 132, .2)',
      borderColor: 'rgba(200, 99, 132, .7)',
      borderWidth: 2,
    }
  ];

  private readonly _chartType = ChartType;

  get chartColors(): any[] {
    if (this.type === ChartType.CJS_LINE) {
      return this.lineChartColor;
    } else if (this.type === ChartType.CJS_BAR) {
      return this.barChartColors;
    }
  }

  get chartType(): any {
    return this._chartType;
  }

}
