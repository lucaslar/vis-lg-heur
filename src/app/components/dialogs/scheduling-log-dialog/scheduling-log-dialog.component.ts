import {Component, Inject} from '@angular/core';
import {LogEventType} from '../../../model/enums/LogEventType';
import {SchedulingLogEntry} from '../../../model/internal/visualization/SchedulingResult';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-scheduling-log-dialog',
  templateUrl: './scheduling-log-dialog.component.html',
  styleUrls: ['./scheduling-log-dialog.component.css', '../shared-dialog-styles.css']
})
export class SchedulingLogDialogComponent {

  /**
   * Stores all enum values
   */
  private _logEventType = LogEventType;

  /**
   * @param data Log entries to be shown
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: SchedulingLogEntry[]) {
  }

  get logEventType(): any {
    return this._logEventType;
  }
}
