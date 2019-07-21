import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {StorageService} from '../../../../services/storage.service';
import {Job} from '../../../../model/Job';

@Component({
  selector: 'app-jobs-termination',
  templateUrl: './jobs-termination.component.html',
  styleUrls: ['./jobs-termination.component.css']
})
export class JobsTerminationComponent implements OnInit {

  private _jobs: Job[];

  constructor(public storage: StorageService) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
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

  get jobs(): Job[] {
    return this._jobs;
  }
}
