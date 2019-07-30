import {Component, Input} from '@angular/core';
import {MatDialog} from '@angular/material';
import {SchedulingLogDialogComponent} from '../../../../dialogs/scheduling-log-dialog/scheduling-log-dialog.component';

@Component({
  selector: 'app-scheduling-log-component',
  templateUrl: './scheduling-log.component.html',
  styleUrls: ['./scheduling-log.component.css']
})
export class SchedulingLogComponent {

  @Input() data: [number, number, string][];

  constructor(private dialog: MatDialog) {
  }

  showLog(): void {
    const filteredData = this.data;
    this.dialog.open(SchedulingLogDialogComponent, {data: filteredData});
  }
}
