import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
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
export class SchedulingGanttComponent implements OnInit {

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

  @Input() nrOfMachines: number;

  @ViewChild('container', {static: false}) container: ElementRef;
  @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;
  @ViewChild('chartConsole', {static: false}) operationConsole: ElementRef;

  private isChartVisible = false;
  private isChartReady = false;
  private selectedOperation: OperationOnConsole;
  private hoveredOperation: OperationOnConsole;
  private colorMap: Map<number, string> = new Map<number, string>();
  private _consoleText = 'Diagramm wird erstellt...'; // default text

  options: TimelineOptions;
  data: [string, string, Date, Date][];

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    const firstMachineOps = this.data.filter(operation => this.data.indexOf(operation) % this.nrOfMachines === 0);

    const sortedFirstMachineOps = this.data
      .filter(operation => this.data.indexOf(operation) % this.nrOfMachines === 0)
      .sort((o1, o2) => (+(<Date>o1[3])) - (+(<Date>o2[3])));

    for (let i = 0; i < firstMachineOps.length; i++) {
      const index = firstMachineOps.indexOf(sortedFirstMachineOps[i]);
      this.colorMap.set(index, this.options.colors[i]);
    }
  }

  detectChartVisibility(): boolean {
    if (!!this.chartContainer !== this.isChartVisible) {
      this.isChartVisible = true;
      this.changeDetector.detectChanges();
    }
    return this.isChartReady;
  }

  onChartReady() {
    if (!this.isChartReady) {
      this.isChartReady = true;
      this._consoleText = 'Interagieren Sie für weitere Details mit dem Diagramm';
    }
  }

  onJobOperationSelected(event): void {
    const row = this.data[event[0].row];
    const color = this.getColorOfRow(event[0].row);
    this.selectedOperation = new OperationOnConsole(row, color);
  }

  onJobOperationMouseEnter(event): void {
    if (event.row > -1) {
      const row = this.data[event.row];
      const color = this.getColorOfRow(event.row);
      this.hoveredOperation = new OperationOnConsole(row, color);
    }
  }

  onJobOperationMouseLeave(): void {
    delete this.hoveredOperation;
  }

  private getColorOfRow(row: number): string {
    const index = Math.floor(row / this.nrOfMachines);
    return this.colorMap.get(index);
  }

  get contentHeight(): number {
    return this.nrOfMachines * 41 + 8 + 64; // rows, padding and console
  }

  get consoleText(): string {
    return this._consoleText;
  }

  get displayedOperation(): OperationOnConsole {
    return this.hoveredOperation ?
      this.hoveredOperation : this.selectedOperation;
  }

}
