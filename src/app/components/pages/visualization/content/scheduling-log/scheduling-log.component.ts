import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {SchedulingLogDialogComponent} from '../../../../dialogs/scheduling-log-dialog/scheduling-log-dialog.component';
import {StorageService} from '../../../../../services/storage.service';
import {LogEventType} from '../../../../../model/enums/LogEventType';
import {SchedulingLogEntry} from '../../../../../model/internal/visualization/SchedulingResult';
import {registerLocaleData} from '@angular/common';
import localeDe from '@angular/common/locales/de';

@Component({
  selector: 'app-scheduling-log-component',
  templateUrl: './scheduling-log.component.html',
  styleUrls: ['./scheduling-log.component.css', '../../../pages-styles.css']
})
export class SchedulingLogComponent implements OnInit {

  @Input() data: SchedulingLogEntry[];

  private _machinesShown: boolean[];

  private _isJobQueueSelected = true;
  private _isProductionStartSelected = true;
  private _isHeuristicBasedSortingSelected = true;

  private _isScheduledInFirstMachineOnly: boolean;

  private _logEventType = LogEventType;

  constructor(private dialog: MatDialog,
              public storage: StorageService) {
  }

  ngOnInit(): void {
    if (this.data) {
      registerLocaleData(localeDe, 'de');
      this._machinesShown = [];
      for (let i = 1; i <= this.storage.nrOfMachines; i++) {
        this._machinesShown.push(true);
      }

      this._isScheduledInFirstMachineOnly =
        this.data.filter(data => data.machineNr === 1 && data.eventType === LogEventType.HEURISTIC_BASED_SORTING).length
        === this.data.filter(data => data.eventType === LogEventType.HEURISTIC_BASED_SORTING).length;
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
      .filter(data => shownMachines.includes(data.machineNr) && shownTypes.includes(data.eventType));
    this.dialog.open(SchedulingLogDialogComponent, {data: filteredData});
  }

  isAnyMachineSelected(): boolean {
    return this.machinesShown.some(m => m === true);
  }

  isAnyLogTypeSelected(): boolean {
    return this.isHeuristicBasedSortingSelected || this.isJobQueueSelected || this.isProductionStartSelected;
  }

  isNoEntryForMachine(): boolean {
    if (this.isScheduledInFirstMachineOnly) {
      const onlySortingSelected = this.isHeuristicBasedSortingSelected && !this.isJobQueueSelected && !this.isProductionStartSelected;
      const machineOneNotSelected = !this.machinesShown[0];
      return onlySortingSelected && machineOneNotSelected;
    } else {
      return false;
    }
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

  get isScheduledInFirstMachineOnly(): boolean {
    return this._isScheduledInFirstMachineOnly;
  }
}
