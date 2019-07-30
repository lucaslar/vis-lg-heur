import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'app-scheduling-log-dialog',
  templateUrl: './scheduling-log-dialog.component.html',
  styleUrls: ['./scheduling-log-dialog.component.css', '../shared-dialog-styles.css']
})
export class SchedulingLogDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: [number, number, string][]) {
  }
}
