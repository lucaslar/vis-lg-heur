import {ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {StorageService} from '../../../../../services/storage.service';
import TimelineOptions = google.visualization.TimelineOptions;
import {OperationOnConsole} from '../../../../../model/internal/visualization/OperationOnConsole';

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

  @Input() timelineData: [string, Date, Date][];
  // TODO Implement colors?
  readonly options = <TimelineOptions>{
    // colors: ['#e0440e', '#e6693e', '#38ec58', '#f3b49f', '#f6c7b6'],
    timeline: {showBarLabels: false},
    tooltip: {
      trigger: 'none'
    }
  };

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
      this._consoleText = 'Geladen! Interagieren Sie für weitere Details mit dem Diagramm';
    }
  }

  onJobOperationSelected(event): void {
    const row = this.timelineData[event[0].row];
    this.selectedOperation = new OperationOnConsole(row);
  }

  onJobOperationMouseEnter(event): void {
    if (event.row > -1) {
      const row = this.timelineData[event.row];
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
