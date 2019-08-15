import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {Job, MachineTimeForJob, SetupTime} from '../../../../model/scheduling/Job';
import {MatDialog} from '@angular/material/dialog';
import {MatExpansionPanelHeader} from '@angular/material/expansion';
import {MatSnackBar} from '@angular/material/snack-bar';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {DialogContent} from '../../../../model/internal/dialog/DialogContent';
import {MachineConfig} from '../../../../model/enums/MachineConfig';
import {DialogType} from '../../../../model/internal/dialog/DialogType';
import {DefinableValue} from '../../../../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../../../../model/internal/value-definition/DefinitionStatus';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';

@Component({
  selector: 'app-jobs-and-machines',
  templateUrl: './jobs-and-machines.component.html',
  styleUrls: ['./jobs-and-machines.component.css', '../../pages-styles.css']
})
export class JobsAndMachinesComponent implements OnInit {

  // TODO feature: store machine times on reducing machine nr.?

  /**
   * Stores all enum values: DefinableValue
   */
  private _definableValue = DefinableValue;

  /**
   * Stores all enum values: DefinitionStatus
   */
  private _configurationStatus = DefinitionStatus;

  /**
   * Current machine configuration
   */
  private readonly _machineConfig = MachineConfig;


  /**
   * Existing jobs
   */
  private _jobs: Job[];

  /**
   * Represents whether machining times are to be generated automatically on adding machines/jobs
   */
  private isAutomaticallyGenerateTimes: boolean;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private changeDetector: ChangeDetectorRef,
    public storage: StorageService
  ) {
  }

  /**
   * Loads jobs from storage on initialization.
   */
  ngOnInit(): void {
    this._jobs = this.storage.jobs;
  }

  /**
   * Due to a new machine nr: Updates all job operations, due dates (if not realistic anymore) and informs the user about changes.
   *
   * @param newMachineNr New number of machines
   */
  onMachineNrChanged(newMachineNr: number): void {
    const messages = [];
    this.storage.nrOfMachines = newMachineNr;
    this.jobs.forEach(job => {
      if (job.machineTimes.length > newMachineNr) {
        job.machineTimes = job.machineTimes.filter(
          machineTime => machineTime.machineNr <= newMachineNr
        );
      } else {
        const message = this.addNewMachineTimesToJob(job);
        if (message) {
          messages.push(message);
        }
      }
    });
    this.openChangedDueDatesInfoIfNeeded(messages);
    this.storage.jobs = this.jobs;
    this.openSnackBar(5, 'Maschinenzahl auf ' + newMachineNr + ' aktualisiert', 'OK');
  }

  /**
   * Sets [isAutomaticallyGenerateTimes} and opens the auto-generate-dialog in case of activating the option and having jobs with
   * undefined machining times.
   *
   * @param newValue true if times are to be generated automatically, false if not
   */
  onAutoTimeGenerationChanged(newValue: boolean): void {
    this.isAutomaticallyGenerateTimes = newValue;
    if (this.isAutomaticallyGenerateTimes) {
      this.openAutoGenDialogIfNeeded();
    }
  }

  /**
   * @param job Job to be stored
   */
  onNewJobCreated(job: Job): void {
    this.addJob(job);
  }

  /**
   * Deletes a job from the current list, updates all dependencies to this deleted job and shows a pop-up informing the user.
   *
   * @param job Job to be deleted
   * @param isMessageToBeHidden (optional) if true, no pop up will be shown
   */
  deleteJob(job: Job, isMessageToBeHidden?: boolean): void {
    this._jobs = this.jobs.filter(j => j !== job);
    let i = 0;
    this.jobs.forEach(j => {
      if (j.id !== ++i) {
        j.id = i;
      }
      if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) !== DefinitionStatus.NOT_DEFINED) {
        j.setupTimesToOtherJobs = j.setupTimesToOtherJobs.filter(sT => sT.idTo !== job.id);
        j.setupTimesToOtherJobs.forEach(sT => sT.idTo = sT.idTo > job.id ? sT.idTo - 1 : sT.idTo);
      }
    });
    this.storage.jobs = this.jobs;
    if (!isMessageToBeHidden) {
      this.openSnackBar(2, 'Auftrag \'' + job.name + '\' (ID: ' + job.id + ') gelöscht', 'Rückgängig')
        .onAction().subscribe(() => this.addJob(job, true));
    }
  }

  /**
   * Copies a job (except for its ID), updates dependencies of other jobs to the original and thus also the copied job and shows a pop-up
   * informing the user.
   *
   * @param job Job to be copied
   * @param header Expansion header of the original job (in list)
   */
  copyJob(job: Job, header: MatExpansionPanelHeader): void {
    header._toggle();
    const copy: Job = <Job>JSON.parse(JSON.stringify(job));
    copy.id = undefined;
    if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) !== DefinitionStatus.NOT_DEFINED) {
      copy.setupTimesToOtherJobs.push(new SetupTime(job.id));
    }
    this.addJob(copy, true);
    this.openSnackBar(2, 'Auftrag \'' + job.name + '\' (ID: ' + job.id + ') kopiert', 'Rückgängig')
      .onAction().subscribe(() => this.deleteJob(copy, true));
  }

  /**
   * Changes the machine order of a job based on a Drag and Drop Event and stores job list after change.
   *
   * @param job Job the machine order is to be changed of
   * @param event Changement of machine order
   */
  changeMachineOrderOfJob(job: Job, event: CdkDragDrop<string[]>): void {
    moveItemInArray(job.machineTimes, event.previousIndex, event.currentIndex);
    this.storage.jobs = this.jobs;
  }

  /**
   * Sets a new value for a specific machine time and stores job list after change.
   * @param machine Machine the operation time on has has been changed
   * @param newValue New operation time
   */
  onTimeOnMachineChange(machine: MachineTimeForJob, newValue: number): void {
    machine.timeOnMachine = newValue;
    this.storage.jobs = this.jobs;
  }

  /**
   * Adds random times for undefined operations of jobs. Configured due dates are considered which means that no times are generated that
   * will make them not realistic anymore.
   */
  addRandomTimesForUndefined(): void {
    this.jobs.forEach(job => {
      let nrOfUndefinedTimes = job.machineTimes.filter(m => m.timeOnMachine === undefined).length;
      if (nrOfUndefinedTimes) {
        job.machineTimes.forEach(
          machineTime => {
            if (!machineTime.timeOnMachine) {
              let time: number;
              if (job.dueDate) {
                const currentTotalTime = job.machineTimes
                  .map(m => m.timeOnMachine)
                  .filter(t => t !== undefined)
                  .reduce((a, b) => a + b, 0);
                const maxTime = job.dueDate - currentTotalTime - nrOfUndefinedTimes;
                time = this.randomTime(maxTime < 10 ? maxTime : 10);
              } else {
                time = this.randomTime(10);
              }
              nrOfUndefinedTimes--;
              machineTime.timeOnMachine = time;
            }
          }
        );
      }
    });
    this.openSnackBar(2, 'Zufällige Zeiten genereriert');
    this.storage.jobs = this.jobs;
    this.changeDetector.detectChanges();
  }

  /**
   * Sorts the machine orders for each job and opens a pop-up informing the user.
   */
  sortEachJobMachineOrder(): void {
    this.jobs.forEach(job => {
      job.machineTimes = job.machineTimes.sort(
        (m1, m2) => {
          if (m1.machineNr < m2.machineNr) {
            return -1;
          } else {
            return 1;
          }
          // Number of m1 and of m2 cannot be the same
        }
      );
    });
    this.openSnackBar(3, 'Abarbeitungsreihenfolge der Arbeitsgänge aller Aufträge sortiert');
    this.storage.jobs = this.jobs;
  }

  /**
   * Opens a confirmation dialog for confirming to delete all job times. If accepted, the desired action is performed
   */
  deleteAllExistingJobTimes(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich die Zeiten der Arbeitsgänge aller Aufträge löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.CONFIRM_WARNING)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs.forEach(job => job.machineTimes.forEach(mT => delete mT.timeOnMachine));
        this.storage.jobs = this.jobs;
        this.changeDetector.detectChanges();
        this.openSnackBar(2, 'Alle Zeiten der Arbeitsgänge gelöscht');
      }
    });
  }

  /**
   * Shuffles the machine orders for each job and opens a pop-up informing the user.
   */
  shuffleMachineOrderOfExistingJobs(): void {
    this.jobs.forEach(job => job.machineTimes = job.machineTimes.sort(() => Math.random() - 0.5));
    this.openSnackBar(3, 'Abarbeitungsreihenfolge der Arbeitsgänge aller Aufträge zufällig angeordnet');
    this.storage.jobs = this.jobs;
  }

  /**
   * Opens a confirmation dialog for confirming to delete all jobs. If accepted, the desired action is performed
   */
  deleteAllExistingJobs(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich alle Aufträge löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.CONFIRM_WARNING)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs = [];
        this.storage.jobs = [];
        this.openSnackBar(2, 'Alle Aufträge gelöscht');
      }
    });
  }

  /**
   * @param job Job the maximum possible configurable machine time is to returned of
   * @param machine Machine the maximum time for the job is to be calculated for
   * @return returns undefined if no due date is configured for the job or else the due date - all other machine times (undefined ones: 1)
   */
  calculateMaxMachineTimeForJob(job: Job, machine: MachineTimeForJob): number | undefined {
    if (job.dueDate) {
      return job.dueDate - job.machineTimes
        .filter(m => m !== machine)
        .map(m => m.timeOnMachine ? m.timeOnMachine : 1)
        .reduce((a, b) => a + b, 0);
    } else {
      return undefined;
    }
  }

  /**
   * Adds a job to the job list. In case of adding a job that already existed (added due to 'Undo'-action), the relevant job dependencies
   * are updated.
   *
   * @param job Job to be added
   * @param isMessageToBeHidden (optional) If true, no informing message is shown
   */
  private addJob(job: Job, isMessageToBeHidden?: boolean): void {
    if (job.id) {
      this.jobs.forEach(jobInList => {
        if (jobInList.id >= job.id) {
          jobInList.id++;
        }
        if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) !== DefinitionStatus.NOT_DEFINED) {
          jobInList.setupTimesToOtherJobs.forEach(sT => sT.idTo = sT.idTo >= job.id ? sT.idTo + 1 : sT.idTo);
        }
      });
      this.jobs.push(job);
      this.jobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    } else {
      job.id = this.jobs.length + 1;
      this.jobs.push(job);
    }

    if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) !== DefinitionStatus.NOT_DEFINED) {
      this.jobs
        .filter(_job => _job !== job)
        .forEach(_job => _job.setupTimesToOtherJobs.push(new SetupTime(job.id)));
    }

    this.storage.jobs = this.jobs;
    if (!isMessageToBeHidden) {
      this.openSnackBar(2, 'Auftrag \'' + job.name + '\' (ID: ' + job.id + ') hinzugefügt', 'Rückgängig')
        .onAction().subscribe(() => this.deleteJob(job, true));
    }
  }

  /**
   * In case of undefined times for jobs: Opens a dialog that for, if confirmed, automatically generating these missing times.
   */
  private openAutoGenDialogIfNeeded(): void {
    if (this.storage.getValueDefinitionStatus(DefinableValue.ALPHA_JOB_TIMES) !== DefinitionStatus.COMPLETELY_DEFINED) {
      this.dialog.open(PopUpComponent, {
        data: new DialogContent(
          'Zeiten fehlender Arbeitsgänge automatisch generieren',
          [
            'Derzeit sind nicht alle Zeiten für die Arbeitsgänge der einzelnen Aufträge ' +
            'festgelegt. Diese können automatisch generiert oder einzeln eingegeben werden. ' +
            'Änderungen sind nach der automatischen Generierung nichtsdestrotz möglich.',
            'Möchten Sie die fehlenden Zeiten automatisch generieren lassen? (Empfohlen)'
          ],
          DialogType.QUESTION
        )
      }).afterClosed().subscribe(result => {
        if (result) {
          this.addRandomTimesForUndefined();
        }
      });
    }
  }

  /**
   * @param max Maximum value to be returned
   * @returns Random value between 1 and specified maximum
   */
  private randomTime(max: number): number {
    return Math.floor(Math.random() * max) + 1;
  }

  /**
   * Adds new times for new machines to a job. Configured due dates are tried to be maintained. Nevertheless, if they are not realistic in
   * any case, they are updated.
   *
   * @param job Job the new machine times are to be added for
   * @returns message if due date had to be changed, undefined if not
   */
  private addNewMachineTimesToJob(job: Job): string | undefined {
    const previousDueDate = job.dueDate;
    const nrOfMachines = this.storage.nrOfMachines;
    let currentTotalTime = job.machineTimes
      .map(m => m.timeOnMachine ? m.timeOnMachine : 1)
      .reduce((a, b) => a + b, 0);
    const isDueDateStillPossible = job.dueDate && job.dueDate >= currentTotalTime + nrOfMachines - job.machineTimes.length;

    for (let i = job.machineTimes.length + 1; i <= nrOfMachines; i++) {
      const machineTimeForJob = new MachineTimeForJob(i);
      let time: number;

      if ((!isDueDateStillPossible)) { // no due date or not possible due date
        time = this.randomTime(10);
        if (job.dueDate) { // due date exists, but is unrealistic
          currentTotalTime += time;
          job.dueDate = currentTotalTime;
        }
      } else { // due date exists and is still realistic
        const maxTime = job.dueDate - currentTotalTime - nrOfMachines + i;
        time = this.randomTime(maxTime < 10 ? maxTime : 10);
        currentTotalTime += time;
      }

      machineTimeForJob.timeOnMachine = this.isAutomaticallyGenerateTimes ? time : undefined;
      job.machineTimes.push(machineTimeForJob);
    }

    if (job.dueDate && !isDueDateStillPossible) {
      job.dueDate = Math.floor(job.dueDate * 1.2);
      return 'Auftrag \'' + job.name + '\' (ID: ' + job.id + '): von ' + previousDueDate + ' aktualisiert auf ' + job.dueDate;
    }
  }

  /**
   * In case of messages: Opens a dialog informing about due dates that had to be changed inevitably.
   *
   * @param messages Messages concerning due dates for jobs that had to be changed
   */
  private openChangedDueDatesInfoIfNeeded(messages: string[]): void {
    if (messages.length > 0) {
      this.dialog.open(PopUpComponent, {
        data: new DialogContent(
          'Geänderte Fertigstellungstermine',
          ['Die Fertigstellungstermine folgender Aufträge konnten nicht eingehalten werden und wurden aktualisiert:'],
          DialogType.INFO,
          messages
        )
      });
    }
  }

  /**
   * Opens a snackbar.
   *
   * @param seconds Duration the snackbar is to be shown in seconds
   * @param message Message to be shown
   * @param actionMessage Message of the action buttton
   * @returns Snackbar ref
   */
  private openSnackBar(seconds: number, message: string, actionMessage?: string) {
    return this.snackBar.open(message, actionMessage ? actionMessage : 'OK',
      {
        panelClass: 'color-white',
        duration: seconds * 1000
      }
    );
  }

  get jobs(): Job[] {
    return this._jobs;
  }

  set jobs(jobs: Job[]) {
    this._jobs = jobs;
  }

  get machineConfig(): any {
    return this._machineConfig;
  }

  get definableValue(): any {
    return this._definableValue;
  }

  get configurationStatus(): any {
    return this._configurationStatus;
  }

}
