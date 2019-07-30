import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {SchedulingLogDialogComponent} from '../../../../dialogs/scheduling-log-dialog/scheduling-log-dialog.component';
import {StorageService} from '../../../../../services/storage.service';
import {LogEventType} from '../../../../../model/enums/LogEventType';

@Component({
  selector: 'app-scheduling-log-component',
  templateUrl: './scheduling-log.component.html',
  styleUrls: ['./scheduling-log.component.css', '../../../pages-styles.css']
})
export class SchedulingLogComponent implements OnInit {

  @Input() data: [number, number, string, LogEventType][];

  private _machinesShown: boolean[];

  private _isJobQueueSelected = true;
  private _isProductionStartSelected = true;
  private _isHeuristicBasedSortingSelected = true;

  private _logEventType = LogEventType;

  constructor(private dialog: MatDialog,
              public storage: StorageService) {
  }

  ngOnInit(): void {
    this._machinesShown = [];
    for (let i = 1; i <= this.storage.nrOfMachines; i++) {
      this._machinesShown.push(true);
    }
  }

  showLog(): void {
    const shownMachines = this.machineNrs.filter(mnr => this._machinesShown[mnr - 1]);
    const shownTypes = [];

    if (this.isProductionStartSelected) {
      shownTypes.push(LogEventType.PRODUCTION_START);
    }
    if (this.isHeuristicBasedSortingSelected) {
      shownTypes.push(LogEventType.HEURISTIC_BASED_SORTING);
    }
    if (this.isJobQueueSelected) {
      shownTypes.push(LogEventType.JOB_QUEUE);
    }

    const filteredData = this.data
      .filter(data => shownMachines.includes(data[1]) && shownTypes.includes(data[3]));
    this.dialog.open(SchedulingLogDialogComponent, {data: filteredData});
  }

  isLogEmpty(): boolean {
    return this._machinesShown.every(m => m === false) ||
      (!this.isHeuristicBasedSortingSelected && !this.isJobQueueSelected && !this.isProductionStartSelected);
  }

  get machineNrs(): number[] {
    const mnrs = [];
    for (let i = 1; i <= this._machinesShown.length; i++) {
      mnrs.push(i);
    }
    return mnrs;
  }

  get logEventType(): any {
    return this._logEventType;
  }

  get machinesShown(): boolean[] {
    return this._machinesShown;
  }

  get isJobQueueSelected(): boolean {
    return this._isJobQueueSelected;
  }

  set isJobQueueSelected(value: boolean) {
    this._isJobQueueSelected = value;
  }

  get isProductionStartSelected(): boolean {
    return this._isProductionStartSelected;
  }

  set isProductionStartSelected(value: boolean) {
    this._isProductionStartSelected = value;
  }

  get isHeuristicBasedSortingSelected(): boolean {
    return this._isHeuristicBasedSortingSelected;
  }

  set isHeuristicBasedSortingSelected(value: boolean) {
    this._isHeuristicBasedSortingSelected = value;
  }
}
