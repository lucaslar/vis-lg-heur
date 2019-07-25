import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {Job, MachineTimeForJob} from '../../../../model/Job';
import {MatDialog, MatExpansionPanelHeader, MatSnackBar} from '@angular/material';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MachineNrPopupComponent} from '../../../dialogs/machine-nr-popup/machine-nr-popup.component';
import {DialogContent} from '../../../../model/internal/DialogContent';
import {MachineConfig} from '../../../../model/enums/MachineConfig';
import {DialogType} from '../../../../model/internal/DialogType';
import {DefinableValue} from '../../../../model/internal/DefinableValue';
import {DefinitionStatus} from '../../../../model/internal/DefinitionStatus';
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
  private _jobNameInput: string;

  private _isShuffleMachineOrder: boolean;
  private _isAutomaticallyGenerateTimes: boolean;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public storage: StorageService
  ) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    this.isAutomaticallyGenerateTimes = true;
    this.isShuffleMachineOrder = false;
  }

  createNewJob(): void {
    const job = new Job(this.jobNameInput);
    this.jobNameInput = undefined;
    this.generateMachineOrderForJob(job);
    if (this.storage.nrOfMachines > 1 && this.isShuffleMachineOrder) {
      job.machineTimes = job.machineTimes.sort(() => Math.random() - 0.5);
    }
    this.addJob(job);
  }

  deleteJob(job: Job, isMessageToBeHidden?: boolean): void {
    this._jobs = this.jobs.filter(j => j !== job);

    let i = 0;
    this.jobs.forEach(o => {
      if (o.id !== ++i) {
        o.id = i;
      }
    });
    this.storage.jobs = this.jobs;
    if (!isMessageToBeHidden) {
      this.openSnackBar(2, 'Auftrag \'' + job.name + '\' (ID: ' + job.id + ') gelöscht!', 'Rückgängig')
        .onAction().subscribe(() => this.addJob(job, true));
    }
  }

  copyJob(job: Job, header: MatExpansionPanelHeader): void {
    header._toggle();
    const copy: Job = <Job>JSON.parse(JSON.stringify(job));
    copy.id = undefined;
    this.addJob(copy, true);
    this.openSnackBar(2, 'Auftrag \'' + job.name + '\' (ID: ' + job.id + ') kopiert!', 'Rückgängig')
      .onAction().subscribe(() => this.deleteJob(copy, true));
  }

  changeMachineOrderOfJob(job: Job, event: CdkDragDrop<string[]>): void {
    moveItemInArray(job.machineTimes, event.previousIndex, event.currentIndex);
    this.storage.jobs = this.jobs;
  }

  openMachinePopUp(): void {
    this.dialog.open(MachineNrPopupComponent).afterClosed().subscribe(result => {
      if (result) {
        const messages = [];
        this.storage.nrOfMachines = result;
        this.jobs.forEach(job => {
          if (job.machineTimes.length > result) {
            job.machineTimes = job.machineTimes.filter(
              machineTime => machineTime.machineNr <= result
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
        this.openSnackBar(5, 'Maschinenzahl auf ' + result + ' aktualisiert', 'OK');
      }
    });
  }

  openMachinesDescription(): void {
    const currentCOnfiguration = this.storage.machineConfigParam;
    let configInWords: string;
    let whatDoesConfigMean: string | string[];

    if (currentCOnfiguration === MachineConfig.ONE_MACHINE) {
      configInWords = 'Es gibt genau eine Maschine';
      whatDoesConfigMean = [
        'Es kann nur einen Arbeitsgang an genau einer Maschine geben. Somit erübigt es sich, ' +
        'einen Vergleich der Reihenfolge der Arbeitsgänge zu ziehen.',
        'Flow- bzw. Jobshop setzen mindestens zwei Maschinen voraus. ' +
        'Erhöhen Sie die Anzahl an Maschinen, ergäbe sich ein Flowshop.'];
    } else if (currentCOnfiguration === MachineConfig.FLOWSHOP) {
      configInWords = 'Flowshop mit ' + this.storage.nrOfMachines + ' Maschinen';
      let machineOrderAsString = 'Erst M. ';
      this.jobs[0].machineTimes.map(m => m.machineNr).forEach(
        machineNr => machineOrderAsString += machineNr + (
          this.jobs[0].machineTimes.findIndex(m => m.machineNr === machineNr) === this.storage.nrOfMachines - 1 ?
            '.' : ', dann M. '
        )
      );
      whatDoesConfigMean = [
        (this.jobs.length > 1 ?
            'Die ' + this.jobs[0].machineTimes.length + ' Arbeitsgänge aller ' + this.jobs.length +
            ' Aufträge werden in derselben Reihenfolge ausgeführt, nämlich: '
            :
            'Da die Reihenfolge der ' + this.jobs[0].machineTimes.length + ' Arbeitsgänge ' +
            'des aktuell einzigen Auftrags ' + 'nicht mit der Reihenfolge der Arbeitsgänge ' +
            'anderer Aufträge verglichen werden kann, liegt formal ein Flowshop vor. ' +
            'Die (derzeit einzige) Reihenfolge der Arbeitsgänge ist: '
        ) +
        machineOrderAsString,
        (this.jobs.length > 1 ?
            'Verschieben Sie '
            :
            'Fügen Sie mindestens einen Auftrag hinzu und verschieben anschließend '
        ) + 'die Arbeitsgänge eines Auftrags, entsteht ein Jobshop.'
      ];
    } else if (currentCOnfiguration === MachineConfig.JOBSHOP) {
      configInWords = 'Jobshop mit ' + this.storage.nrOfMachines + ' Maschinen';
      whatDoesConfigMean = [
        'Die Arbeitsgänge der ' + this.jobs.length + ' Aufträge weisen nicht dieselbe Reihenfolge auf.',
        'Sorgen Sie dafür, dass die Reihenfolge der Arbeitsgänge aller Aufträge gleich ist, entsteht ein ' +
        'Flowshop. Hierfür können Sie auch den dafür vorgesehenen Button unterhalb der Auftragseingabe nutzen.'
      ];
    } else {
      configInWords = 'Aussage nicht möglich';
      whatDoesConfigMean = [
        'Es sind keine Aufträge definiert, daher kann die Maschinenumgebung nicht ' +
        'spezifiziert werden.',
        'Fügen Sie bitte mindestens einen Auftrag hinzu.'
      ];
    }

    const texts = [
      'Aktuelle Maschinenumgebung: ' +
      configInWords + '.'
    ];
    texts.push(...whatDoesConfigMean);

    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Maschinenumgebung',
        texts,
        DialogType.INFO
      )
    });
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
    this.openSnackBar(2, 'Abarbeitungsreihenfolgen sortiert');
    this.storage.jobs = this.jobs;
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

  private generateMachineOrderForJob(job: Job): void {
    job.machineTimes = [];
    for (let i = 1; i <= this.storage.nrOfMachines; i++) {
      job.machineTimes.push(new MachineTimeForJob(
        i, this.isAutomaticallyGenerateTimes ? this.randomTime(10) : undefined
      ));
    }
  }

  private addJob(job: Job, isMessageToBeHidden?: boolean): void {

    if (job.id) {
      console.log(job.id);
      this.jobs.forEach(jobInList => {
        if (jobInList.id >= job.id) {
          jobInList.id++;
        }
      });
      this.jobs.push(job);
      this.jobs = this.jobs.sort((j1, j2) => j1.id - j2.id);
    } else {
      job.id = this.jobs.length + 1;
      this.jobs.push(job);
    }
    this.storage.jobs = this.jobs;
    if (!isMessageToBeHidden) {
      this.openSnackBar(2, 'Auftrag \'' + job.name + '\' (ID: ' + job.id + ') hinzugefügt!', 'Rückgängig')
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
            'festgelegt. Diese können automatisch generiert werden oder einzeln eingegeben werden. ' +
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

  get jobNameInput(): string {
    return this._jobNameInput;
  }

  set jobNameInput(jobNameInput: string) {
    this._jobNameInput = jobNameInput;
  }

  get isAutomaticallyGenerateTimes(): boolean {
    return this._isAutomaticallyGenerateTimes;
  }

  set isAutomaticallyGenerateTimes(isAutomaticallyGenerateTimes: boolean) {
    this._isAutomaticallyGenerateTimes = isAutomaticallyGenerateTimes;
    if (isAutomaticallyGenerateTimes) {
      this.openAutoGenDialogIfNeeded();
    }
  }

  get isShuffleMachineOrder(): boolean {
    return this._isShuffleMachineOrder;
  }

  set isShuffleMachineOrder(isShuffleMachineOrder: boolean) {
    this._isShuffleMachineOrder = isShuffleMachineOrder;
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
