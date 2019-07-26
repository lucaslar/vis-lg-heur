import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {StorageService} from '../../../../../services/storage.service';

@Component({
  selector: 'app-scheduling-gantt',
  templateUrl: './scheduling-gantt.component.html',
  styleUrls: [
    './scheduling-gantt.component.css',
    '../../../pages-styles.css',
    '../shared-chart-styles.css'
  ]
})
export class SchedulingGanttComponent {


  // TODO:  x axis?
  // TODO: Custom tool tips
  // TODO Implement colors
  options = {
    colors: ['#e0440e', '#e6693e', '#38ec58', '#f3b49f', '#f6c7b6'],
  };


  private isChartVisible = false;

  @Input() timelineData: [string, Date, Date][];

  @ViewChild('chart', {static: false}) chart: ElementRef;

  constructor(private changeDetector: ChangeDetectorRef,
              public storage: StorageService) {
  }

  detectChartVisibility(): boolean {
    if (!!this.chart !== this.isChartVisible) {
      this.isChartVisible = !!this.chart;
      this.changeDetector.detectChanges();
    }
    // Return true if chart is loaded and shown (height > 0)
    return !!this.chart && !!(<HTMLDivElement>this.chart.nativeElement).offsetHeight;
  }

  get contentHeight(): number {
    return this.storage.nrOfMachines * 41 + 50;
  }

}
