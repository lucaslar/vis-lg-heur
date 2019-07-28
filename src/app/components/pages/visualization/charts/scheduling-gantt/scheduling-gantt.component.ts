import {ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {StorageService} from '../../../../../services/storage.service';
import TimelineOptions = google.visualization.TimelineOptions;
import {OperationOnConsole} from '../../../../../model/internal/visualization/OperationOnConsole';
import {TimelineData} from '../../../../../model/internal/visualization/VisualizableData';

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

  options: TimelineOptions;
  data: [string, string, Date, Date][];

  @Input() set timelineData(timelineData: TimelineData) {
    this.data = timelineData.timelineData;
    this.options = <TimelineOptions>{
      timeline: {showBarLabels: false},
      tooltip: {
        trigger: 'none'
      },
      colors: timelineData.colors
    };
  }

  // TODO Both needed?
  private isChartVisible = false;
  private isChartActuallyShown = false;
  private selectedOperation: OperationOnConsole;
  private hoveredOperation: OperationOnConsole;
  private _consoleText = 'Diagramm wird erstellt...'; // default text

  @ViewChild('container', {static: false}) container: ElementRef;
  @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;
  @ViewChild('chartConsole', {static: false}) operationConsole: ElementRef;

  constructor(private changeDetector: ChangeDetectorRef,
              public storage: StorageService) {
  }

  // TODO: Delete this method and observe chart?
  detectChartVisibility(): boolean {
    if (!!this.chartContainer !== this.isChartVisible) {
      this.isChartVisible = true;
      this.changeDetector.detectChanges();
    }
    return this.isChartActuallyShown;
  }

  onChartReady() {
    if (!this.isChartActuallyShown) {
      this.isChartActuallyShown = true;
      this._consoleText = 'Interagieren Sie für weitere Details mit dem Diagramm';
    }
  }

  onJobOperationSelected(event): void {
    const row = this.data[event[0].row];
    this.selectedOperation = new OperationOnConsole(row);
  }

  onJobOperationMouseEnter(event): void {
    if (event.row > -1) {
      const row = this.data[event.row];
      this.hoveredOperation = new OperationOnConsole(row);
    }
  }

  onJobOperationMouseLeave(): void {
    delete this.hoveredOperation;
  }

  get contentHeight(): number {
    return this.storage.nrOfMachines * 41 + 8 + 64; // rows, padding and console
  }

  get consoleText(): string {
    return this._consoleText;
  }

  get displayedOperation(): OperationOnConsole {
    return this.hoveredOperation ?
      this.hoveredOperation : this.selectedOperation;
  }

}
