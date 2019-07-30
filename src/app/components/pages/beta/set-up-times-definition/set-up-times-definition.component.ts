import {Component, OnDestroy, OnInit} from '@angular/core';
import {Job, SetupTime} from '../../../../model/Job';
import {StorageService} from '../../../../services/storage.service';
import {DefinableValue} from '../../../../model/internal/value-definition/DefinableValue';

@Component({
  selector: 'app-set-up-times-definition',
  templateUrl: './set-up-times-definition.component.html',
  styleUrls: ['./set-up-times-definition.component.css', '../../pages-styles.css']
})
export class SetUpTimesDefinitionComponent implements OnInit, OnDestroy {

  private _jobs: Job[];

  constructor(public storage: StorageService) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    // Either declared for all or for none:
    if (!this.jobs[0].setupTimesToOtherJobs) {
      this.initializeSetupTimesForJobs();
    }
  }

  ngOnDestroy(): void {
    this.storage.deleteUndefinedBetaValuesLockingFunctions();
  }

  private initializeSetupTimesForJobs(): void {
    this.jobs.forEach(job => job.setupTimesToOtherJobs =
      this.jobs.filter(_job => job !== _job)
        .map(otherJob => new SetupTime(otherJob.id, undefined))
    );
  }

  get jobs(): Job[] {
    return this._jobs;
  }
}
