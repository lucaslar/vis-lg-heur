import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {Job, MachineTimeForJob, SetupTime} from '../../../../model/Job';
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

  // TODO: 'Undo' in snackbar for sorting and JS->FS?

  private _definableValue = DefinableValue;
  private _configurationStatus = DefinitionStatus;

  private readonly _machineConfig = MachineConfig;

  private _jobs: Job[];
  private isAutomaticallyGenerateTimes: boolean;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public storage: StorageService
  ) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
  }

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

  onAutoTimeGenerationChanged(newValue: boolean): void {
    this.isAutomaticallyGenerateTimes = newValue;
    if (this.isAutomaticallyGenerateTimes) {
      this.openAutoGenDialogIfNeeded();
    }
  }

  onNewJobCreated(job: Job): void {
    this.addJob(job);
  }

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

  changeMachineOrderOfJob(job: Job, event: CdkDragDrop<string[]>): void {
    moveItemInArray(job.machineTimes, event.previousIndex, event.currentIndex);
    this.storage.jobs = this.jobs;
  }

  onTimeOnMachineChange(machine: MachineTimeForJob, newValue: number): void {
    machine.timeOnMachine = newValue;
    this.storage.jobs = this.jobs;
  }

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
  }

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

  shuffleMachineOrderOfExistingJobs(): void {
    this.jobs.forEach(job => job.machineTimes = job.machineTimes.sort(() => Math.random() - 0.5));
    this.openSnackBar( 3, 'Abarbeitungsreihenfolge der Arbeitsgänge aller Aufträge zufällig angeordnet');
    this.storage.jobs = this.jobs;
  }

  deleteAllExistingJobs(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich alle Aufträge löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.QUESTION)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs = [];
        this.storage.jobs = [];
        this.openSnackBar(2, 'Alle Aufträge gelöscht');
      }
    });
  }

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

  private randomTime(max: number): number {
    return Math.floor(Math.random() * max) + 1;
  }

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

  private openChangedDueDatesInfoIfNeeded(messages: string[]) {
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
