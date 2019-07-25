import {Component, Input} from '@angular/core';
import {ChartType, Dataset} from '../../../../model/internal/VisualizableData';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css', '../../pages-styles.css']
})
export class ChartComponent {

  @Input() title: string;
  @Input() type: ChartType;
  @Input() datasets: Dataset[];
  @Input() labels: string[];
  @Input() colors: Array<any>; // TODO Change type/Value defined in this component?

  private readonly scaledDiagramOptions = {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }, responsive: true
  };

  private readonly anyDiagramOptions = {
    responsive: true
  };

  // TODO Add more
  private readonly barChartColors: Array<any> = [
    {
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
      ],
      borderColor: [
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 2,
    }
  ];

  private readonly lineChartColor: Array<any> = [
    {
      backgroundColor: 'rgba(105, 0, 132, .2)',
      borderColor: 'rgba(200, 99, 132, .7)',
      borderWidth: 2,
    }
  ];

  private readonly doughnutChartColors: Array<any> = [
    {
      backgroundColor: ['#F7464A', '#46BFBD', '#FDB45C', '#016AB1', '#949FB1', '#4D5360', '#8ABA18', '#2A92FA', '#612345', '019BAC'],
      borderWidth: 2,
    }
  ];

  get chartColors(): any[] {
    if (this.type === ChartType.LINE) {
      return this.lineChartColor;
    } else if (this.type === ChartType.BAR) {
      return this.barChartColors;
    } else if (this.type === ChartType.DOUGHNUT) {
      return this.doughnutChartColors;
    }
  }

  get options(): any {
    if (this.type === ChartType.DOUGHNUT) {
      return this.anyDiagramOptions;
    } else {
      return this.scaledDiagramOptions;
    }
  }

}
