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

  /**
   * Sets timeline data as well as options that had to be defined due to using the chart in a different way.
   * @param timelineData Timeline data to be set (operations in milliseconds)
   */
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

  /**
   * Nr of machines and thus of rows in the chart
   */
  @Input() nrOfMachines: number;

  /**
   * Reference to the conainer of this component
   */
  @ViewChild('container', {static: false}) container: ElementRef;

  /**
   * Reference to the chart container
   */
  @ViewChild('chartContainer', {static: false}) chartContainer: ElementRef;

  /**
   * Reference to the console below the chart
   */
  @ViewChild('chartConsole', {static: false}) operationConsole: ElementRef;

  /**
   * Represents whether the chart is visible or not
   */
  private isChartVisible = false;

  /**
   * Represents whether the chart is ready or not
   */
  private isChartReady = false;

  /**
   * Operation from the chart selected by the user
   */
  private selectedOperation: OperationOnConsole;

  /**
   * Operation from the chart hovered by the user
   */
  private hoveredOperation: OperationOnConsole;

  /**
   * Map containing colors for certain timestamps (first machine operations)
   */
  private colorMap: Map<number, string> = new Map<number, string>();

  /**
   * Text to be shown on the console
   */
  private _consoleText = 'Diagramm wird erstellt...'; // default text


  /**
   * Further options for the timeline
   */
  options: TimelineOptions;

  /**
   * Data to be displayed in the chart
   */
  data: [string, string, Date, Date][];

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  /**
   * On initialization, values are added to {colorMap} in order to display the unqiue colors of each job in each machine.
   */
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

  /**
   * Sets {isChartVisible} to true whenever the chart container is loaded
   * @returns isChartReady
   */
  detectChartVisibility(): boolean {
    if (!!this.chartContainer !== this.isChartVisible) {
      this.isChartVisible = true;
      this.changeDetector.detectChanges();
    }
    return this.isChartReady;
  }

  /**
   * If the chart is ready, the respective variable is set and the text to be displayed below the chart is uupdated.
   */
  onChartReady() {
    if (!this.isChartReady) {
      this.isChartReady = true;
      this._consoleText = 'Interagieren Sie für weitere Details mit dem Diagramm';
    }
  }

  /**
   * Sets the selected operation to be displayed (fixed)
   * @param event Selected operation
   */
  onJobOperationSelected(event): void {
    const row = this.data[event[0].row];
    const color = this.getColorOfRow(event[0].row);
    this.selectedOperation = new OperationOnConsole(row, color);
  }

  /**
   * Sets the hovered operation to be displayed (not fixed)
   * @param event Selected operation
   */
  onJobOperationMouseEnter(event): void {
    if (event.row > -1) {
      const row = this.data[event.row];
      const color = this.getColorOfRow(event.row);
      this.hoveredOperation = new OperationOnConsole(row, color);
    }
  }

  /**
   * Deletes the hovered operation to be displayed
   */
  onJobOperationMouseLeave(): void {
    delete this.hoveredOperation;
  }

  /**
   * @param row Row representing job data
   * @returns Color specified for the given job
   */
  private getColorOfRow(row: number): string {
    const index = Math.floor(row / this.nrOfMachines);
    return this.colorMap.get(index);
  }

  /**
   * @returns Calculated height of the wrapper of console and diagram
   */
  get contentHeight(): number {
    return this.nrOfMachines * 41 + 8 + 64; // rows, padding and console
  }

  /**
   * @returns the operation to be shown on the console. (Hovered preferred)
   */
  get displayedOperation(): OperationOnConsole {
    return this.hoveredOperation ?
      this.hoveredOperation : this.selectedOperation;
  }

  get consoleText(): string {
    return this._consoleText;
  }

}
