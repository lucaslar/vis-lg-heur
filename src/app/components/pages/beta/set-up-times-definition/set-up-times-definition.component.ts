import {Component, OnDestroy, OnInit} from '@angular/core';
import {Job, SetupTime} from '../../../../model/Job';
import {StorageService} from '../../../../services/storage.service';
import {DefinableValue} from '../../../../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../../../../model/internal/value-definition/DefinitionStatus';
import {MatDialog, MatSnackBar} from '@angular/material';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';
import {DialogContent} from '../../../../model/internal/dialog/DialogContent';
import {DialogType} from '../../../../model/internal/dialog/DialogType';

@Component({
  selector: 'app-set-up-times-definition',
  templateUrl: './set-up-times-definition.component.html',
  styleUrls: ['./set-up-times-definition.component.css', '../../pages-styles.css']
})
export class SetUpTimesDefinitionComponent implements OnInit, OnDestroy {

  private _jobs: Job[];

  constructor(public storage: StorageService, private dialog: MatDialog, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    const definitionStatus = this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES);
    if (definitionStatus === DefinitionStatus.NOT_DEFINED) {
      this.initializeSetupTimesForJobs();
    }
    this.openAutoGenerationDialogIfNeeded(definitionStatus);
  }

  ngOnDestroy(): void {
    this.storage.deleteUndefinedBetaValuesBlockingFunctions();
  }

  otherJobsForJob(job): Job[] {
    return this.jobs.filter(otherJob => job !== otherJob);
  }

  findSetupTimeRelationForJob(job: Job, otherJob: Job): SetupTime {
    return job.setupTimesToOtherJobs.find(setupTime => setupTime.idTo === otherJob.id);
  }

  onSetupValueChange(job: Job, otherJob: Job, newValue: number): void {
    this.findSetupTimeRelationForJob(job, otherJob).duration = newValue;
    this.storage.jobs = this.jobs;
  }

  addRandomSetupTimes(): void {
    this.jobs.forEach(job => job.setupTimesToOtherJobs
      .forEach(setupTime => setupTime.duration = setupTime.duration !== undefined ? setupTime.duration : (Math.floor(Math.random() * 5) + 1))
    );
    this.storage.jobs = this.jobs;
    this.snackBar.open('Fehlende Rüstzeiten zufällig erstellt', 'OK',
      {panelClass: 'color-white', duration: 2000}
    );
  }

  deleteAllExistingSetupTimes(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich alle Rüstzeiten löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.QUESTION)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs.forEach(job => job.setupTimesToOtherJobs
          .forEach(setupTime => delete setupTime.duration)
        );
        this.storage.jobs = this.jobs;
        this.snackBar.open('Alle Rüstzeiten gelöscht', 'OK',
          {panelClass: 'color-white', duration: 2000}
        );
      }
    });
  }

  isSetupTimeOfEachJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) === DefinitionStatus.COMPLETELY_DEFINED;
  }

  isSetupTimeOfNoJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) === DefinitionStatus.NOT_DEFINED;
  }

  private openAutoGenerationDialogIfNeeded(definitionStatus: DefinitionStatus): void {
    if (definitionStatus !== DefinitionStatus.COMPLETELY_DEFINED) {
      this.dialog.open(PopUpComponent, {
        data: new DialogContent(
          'Fehlende Rüstzeiten automatisch generieren',
          [
            'Derzeit sind nicht für alle Aufträge reihenfolgeabhängige Rüstzeiten ' +
            'festgelegt. Diese können automatisch generiert oder einzeln eingegeben werden. ' +
            'Änderungen sind nach der automatischen Generierung nichtsdestrotz möglich.',
            'Möchten Sie die fehlenden Rüstzeiten automatisch generieren lassen? (Empfohlen)'
          ],
          DialogType.QUESTION
        )
      }).afterClosed().subscribe(result => {
        if (result) {
          this.addRandomSetupTimes();
        }
      });
    }
  }

  private initializeSetupTimesForJobs(): void {
    this.jobs.forEach(job => job.setupTimesToOtherJobs =
      this.jobs.filter(_job => job !== _job)
        .map(otherJob => new SetupTime(otherJob.id))
    );
  }

  get jobs(): Job[] {
    return this._jobs;
  }
}
