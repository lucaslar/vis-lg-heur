import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {StorageService} from '../../../../services/storage.service';
import {Job} from '../../../../model/scheduling/Job';
import {DialogContent} from '../../../../model/internal/dialog/DialogContent';
import {DialogType} from '../../../../model/internal/dialog/DialogType';
import {DefinitionStatus} from '../../../../model/internal/value-definition/DefinitionStatus';
import {DefinableValue} from '../../../../model/internal/value-definition/DefinableValue';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-jobs-termination',
  templateUrl: './jobs-termination.component.html',
  styleUrls: ['./jobs-termination.component.css', '../../pages-styles.css']
})
export class JobsTerminationComponent implements OnInit {

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
   * On initialization, the jobs are loaded from the storage and a dialog offering to automatically generate due dates is opened in case of
   * undefined values.
   */
  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    if (!this.isDueDateOfEachJobConfigured()) {
      this.dialog.open(PopUpComponent, {
        data: new DialogContent(
          'Fehlende Fertigstellungstermine automatisch generieren',
          [
            'Derzeit sind nicht für alle Aufträge Fertigstellungstermine festgelegt. ' +
            'Diese können automatisch generiert oder einzeln eingegeben werden. ' +
            'Änderungen sind nach der automatischen Generierung nichtsdestrotz möglich.',
            'Es wird hierbei versucht, realistische Fertgstellungstermine zu erzeugen, indem für alle Aufträge ' +
            'basierend auf aktuell konfigurierten Zeiten ihrer jeweiligen Arbeitsgänge die Gesamtbearbeitungsdauer ' +
            'ermittelt und anschließend der Fertigstellungstermin als Summe dieser Gesamtbearbeitungsdauer und der ' +
            'Zeit für die ersten Arbeitsgänge (6 wenn undefiniert) aller Aufträge mit Fertigstellungstermin festgelegt wird. ' +
            'Sollten die Zeiten für Arbeitsgänge zur Berechnung der Gesamtbearbeitungsdauer eines Auftrags unvollständig ' +
            'sein, so werden für sie anhand der existierenden Zeiten Durchschnitte angenommen, sodass eine erwartete ' +
            'Gesamtbearbeitungsdauer ermittelt wird. Sollten gar keine Zeiten definiert sein, wird die Anzahl an ' +
            'Arbeitsgängen mit 6 multipliziert.',
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

  /**
   * @param job Job the minimum due date is to be calculated for
   * @returns Lowest possible (due to machine times) due date for a job
   */
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

  /**
   * @param job Job the due date is to be stored for
   * @param dueDate New due date
   */
  onDueDateChanged(job: Job, dueDate: number): void {
    job.dueDate = dueDate;
    this.storage.jobs = this.jobs;
  }

  /**
   * @returns true if each due date is configured
   */
  isDueDateOfEachJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_DUE_DATES) === DefinitionStatus.COMPLETELY_DEFINED;
  }

  /**
   * @returns true if no due date is configured
   */
  isDueDateOfNoJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_DUE_DATES) === DefinitionStatus.NOT_DEFINED;
  }

  /**
   * Opens a confirmation dialog for confirming to delete all existing due dates. If accepted, the desired action is performed.
   */
  deleteAllExistingDueDates(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich alle gewünschten Fertigstellungstermine löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.CONFIRM_WARNING)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs.forEach(job => delete job.dueDate);
        this.changeDetector.detectChanges();
        this.storage.jobs = this.jobs;
        this.snackBar.open('Alle Fertigstellungstermine gelöscht', 'OK',
          {panelClass: 'color-white', duration: 2000}
        );
      }
    });
  }

  /**
   * Adds random (realistic) due dates for each job the due date of is undefined. The further way how they are calculated is documented
   * in this code and in the descriptional pop-up for automatically generating due dates.
   */
  addRandomDueDates(): void {
    let sumOfFirstSteps = this.jobs
      .filter(job => job.dueDate)
      .map(job => job.machineTimes[0].timeOnMachine ? job.machineTimes[0].timeOnMachine : 6)
      .reduce((a, b) => a + b, 0);

    this.jobs.forEach(job => {
      if (!job.dueDate) {
        const nrOfDefinedTimes = job.machineTimes
          .filter(m => m.timeOnMachine !== undefined).length;
        let span: number;

        // Create due date by calculating average
        if (nrOfDefinedTimes) {
          span = Math.ceil(job.machineTimes
              .filter(m => m.timeOnMachine !== undefined)
              .map(m => m.timeOnMachine)
              .reduce((a, b) => a + b, 0) // sum of machine times
            / nrOfDefinedTimes * job.machineTimes.length // calculate whole duration based on avg
          ); // round to next higher number
        } else {
          // create due date by multiplying 6 * configured machines
          span = 6 * job.machineTimes.length;
        }
        job.dueDate = sumOfFirstSteps + span;
        sumOfFirstSteps += job.machineTimes[0].timeOnMachine ? job.machineTimes[0].timeOnMachine : 6;
      }
    });
    this.changeDetector.detectChanges();
    this.storage.jobs = this.jobs;
    this.snackBar.open('Fehlende Fertigstellungstermine zufällig erstellt', 'OK',
      {panelClass: 'color-white', duration: 2000}
    );
  }

  get jobs(): Job[] {
    return this._jobs;
  }
}
