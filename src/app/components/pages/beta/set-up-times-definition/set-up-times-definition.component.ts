import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Job, SetupTime} from '../../../../model/scheduling/Job';
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

  /**
   * Job list
   */
  private _jobs: Job[];

  constructor(public storage: StorageService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              private changeDetector: ChangeDetectorRef) {
  }

  /**
   * On initialization, the jobs are loaded from the storage and if no setup times are set yet, the therefor created attribute is
   * initialized for each job. A dialog offering to automatically generate due dates is opened in case of undefined values.
   */
  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    const definitionStatus = this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES);
    if (definitionStatus === DefinitionStatus.NOT_DEFINED) {
      this.initializeSetupTimesForJobs();
    }
    this.openAutoGenerationDialogIfNeeded(definitionStatus);
  }

  /**
   * In case of no set setup times, the therefor created attribute is deleted for each job.
   */
  ngOnDestroy(): void {
    if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) === DefinitionStatus.NOT_DEFINED) {
      this.jobs.forEach(job => delete job.setupTimesToOtherJobs);
      this.storage.jobs = this.jobs;
    }
  }

  /**
   * @param job Job to be excluded from result
   * @returns All jobs except for given job
   */
  otherJobsForJob(job): Job[] {
    return this.jobs.filter(otherJob => job !== otherJob);
  }

  /**
   * @param job Job the setup time relation to another job is to be returned for
   * @param otherJob Id of the job the setup time relation to is to be returned
   * @returns Setup time relation from a given job the job with the given Id
   */
  findSetupTimeRelationForJob(job: Job, otherJob: Job): SetupTime {
    return job.setupTimesToOtherJobs.find(setupTime => setupTime.idTo === otherJob.id);
  }

  /**
   * @param job Job the setup time is to be stored for
   * @param otherJob Job the setup time to is specified
   * @param newValue New setup time
   */
  onSetupValueChange(job: Job, otherJob: Job, newValue: number): void {
    this.findSetupTimeRelationForJob(job, otherJob).duration = newValue;
    this.storage.jobs = this.jobs;
  }

  /**
   * @returns true if each setup time to other jobs is configured
   */
  isSetupTimeOfEachJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) === DefinitionStatus.COMPLETELY_DEFINED;
  }

  /**
   * @returns true if each setup time to other jobs is configured
   */
  isSetupTimeOfNoJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) === DefinitionStatus.NOT_DEFINED;
  }

  /**
   * @param job Job the relations of are to be checked
   * @returns true if not all setup times to other jobs are defined for the given job
   */
  isJobHavingUndefinedRelations(job: Job): boolean {
    return job.setupTimesToOtherJobs.some(sT => sT.duration === undefined);
  }

  /**
   * Adds random setup times for undefined relation between jobs.
   */
  addRandomSetupTimes(): void {
    this.jobs.forEach(job => job.setupTimesToOtherJobs
      .forEach(setupTime => setupTime.duration = setupTime.duration !== undefined ?
        setupTime.duration : ((Math.floor(Math.random() * 10) + 1)))
    );
    this.changeDetector.detectChanges();
    this.storage.jobs = this.jobs;
    this.snackBar.open('Fehlende Rüstzeiten zufällig erstellt', 'OK',
      {panelClass: 'color-white', duration: 2000}
    );
  }

  /**
   * Opens a confirmation dialog for confirming to delete all existing setup times. If accepted, the desired action is performed.
   */
  deleteAllExistingSetupTimes(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich alle Rüstzeiten löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.CONFIRM_WARNING)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs.forEach(job => job.setupTimesToOtherJobs
          .forEach(setupTime => delete setupTime.duration)
        );
        this.changeDetector.detectChanges();
        this.storage.jobs = this.jobs;
        this.snackBar.open('Alle Rüstzeiten gelöscht', 'OK',
          {panelClass: 'color-white', duration: 2000}
        );
      }
    });
  }

  /**
   * Opens a dialog offering to automatically generate setup times in case of any undefined values.
   */
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

  /**
   * Initializes the attribute of each job that represents setup time relations to the respective other jobs.
   */
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
