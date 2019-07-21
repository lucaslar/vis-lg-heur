import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {StorageService} from '../../../../services/storage.service';
import {Job} from '../../../../model/Job';
import {YesNoPopUpComponent} from '../../../dialogs/yes-no-pop-up/yes-no-pop-up.component';
import {DialogContent} from '../../../../model/internal/DialogContent';
import {DialogType} from '../../../../model/internal/DialogType';

@Component({
  selector: 'app-jobs-termination',
  templateUrl: './jobs-termination.component.html',
  styleUrls: ['./jobs-termination.component.css']
})
export class JobsTerminationComponent implements OnInit {

  private _jobs: Job[];

  constructor(public storage: StorageService, private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    if (!this.isDueDateOfEachJobConfigured()) {
      this.dialog.open(YesNoPopUpComponent, {
        data: new DialogContent(
          'Fertigstellungstermine automatisch generieren',
          [
            'Derzeit sind nicht für alle Aufträge Fertigstellungstermine festgelegt. ' +
            'Diese können automatisch generiert werden oder einzeln eingegeben werden. ' +
            'Änderungen sind nach der automatischen Generierung nichtsdestrotz möglich.',
            'Möchten Sie die fehlenden Fertigstellungstermine automatisch generieren lassen? (Empfohlen)'
          ],
          DialogType.QUESTION
        )
      }).afterClosed().subscribe(result => {
        if (result) {
          this.addRandomDueDates();
        }
      });
    }
  }

  calculateMinimumDueDateForJob(job: Job): number {
    let minDueDate = job.machineTimes.length;
    job.machineTimes.forEach(
      m => {
        if (m.timeOnMachine) {
          minDueDate += m.timeOnMachine - 1;
        }
      }
    );
    return minDueDate;
  }

  onDueDateChanged(job: Job, dueDate: number): void {
    job.dueDate = dueDate;
    this.storage.jobs = this.jobs;
  }

  isDueDateOfEachJobConfigured(): boolean {
    return !this.jobs.some(
      job => !job.dueDate
    );
  }

  addRandomDueDates(): void {
    this.jobs.forEach(job => {

        if (!job.dueDate) {
          const nrOfDefinedTimes = job.machineTimes
            .filter(m => m.timeOnMachine !== undefined).length;

          // Create due date by calculating average
          if (nrOfDefinedTimes) {
            job.dueDate = Math.ceil(job.machineTimes
                .filter(m => m.timeOnMachine !== undefined)
                .map(m => m.timeOnMachine)
                .reduce((a, b) => a + b, 0) // sum of machine times
              / nrOfDefinedTimes * job.machineTimes.length // calculate whole duration based on avg
              * 1.1 // add 10%
            ); // round to next higher number
          } else {
            // create due date by multiplying 5 * configured machines
            job.dueDate = 5 * job.machineTimes.length;
          }
        }
      }
    );
    this.storage.jobs = this.jobs;
  }

  get jobs(): Job[] {
    return this._jobs;
  }
}
