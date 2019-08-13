import {ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Job} from '../../../../model/scheduling/Job';
import {StorageService} from '../../../../services/storage.service';
import {MatDialog, MatSnackBar} from '@angular/material';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';
import {DialogContent} from '../../../../model/internal/dialog/DialogContent';
import {DialogType} from '../../../../model/internal/dialog/DialogType';
import {DefinableValue} from '../../../../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../../../../model/internal/value-definition/DefinitionStatus';

@Component({
  selector: 'app-jobs-weighting',
  templateUrl: './jobs-weighting.component.html',
  styleUrls: ['./jobs-weighting.component.css', '../../pages-styles.css']
})
export class JobsWeightingComponent implements OnInit {

  private _jobs: Job[];

  constructor(public storage: StorageService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar,
              private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this._jobs = this.storage.jobs;
    this.openAutoGenerationDialogIfNeeded();
  }

  onWeightChanged(job: Job, weight: number): void {
    job.weight = weight;
    this.storage.jobs = this.jobs;
  }

  isWeightOfEachJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_WEIGHTS) === DefinitionStatus.COMPLETELY_DEFINED;
  }

  isWeightOfNoJobConfigured(): boolean {
    return this.storage.getValueDefinitionStatus(DefinableValue.BETA_WEIGHTS) === DefinitionStatus.NOT_DEFINED;
  }

  deleteAllExistingWeights(): void {
    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Löschen bestätigen',
        ['Möchten Sie wirklich alle Auftragsgewichtungen löschen?', 'Diese Aktion kann nicht rückgängig gemacht werden'],
        DialogType.CONFIRM_WARNING)
    }).afterClosed().subscribe(result => {
      if (result) {
        this.jobs.forEach(job => delete job.weight);
        this.changeDetector.detectChanges();
        this.storage.jobs = this.jobs;
        this.snackBar.open('Alle Gewichtungen gelöscht', 'OK',
          {panelClass: 'color-white', duration: 2000}
        );
      }
    });
  }

  addRandomWeights(): void {
    this.jobs
      .filter(job => !job.weight)
      .forEach(job => job.weight = Math.floor(Math.random() * 5) + 1);
    this.changeDetector.detectChanges();
    this.storage.jobs = this.jobs;
    this.snackBar.open('Fehlende Gewichtungen zufällig erstellt', 'OK',
      {panelClass: 'color-white', duration: 2000}
    );
  }

  private openAutoGenerationDialogIfNeeded(): void {
    if (!this.isWeightOfEachJobConfigured()) {
      this.dialog.open(PopUpComponent, {
        data: new DialogContent(
          'Fehlende Auftragsgewichtungen automatisch generieren',
          [
            'Derzeit sind nicht für alle Aufträge Gewichtungen ' +
            'festgelegt. Diese können automatisch generiert oder einzeln eingegeben werden. ' +
            'Änderungen sind nach der automatischen Generierung nichtsdestrotz möglich.',
            'Möchten Sie die fehlenden Gewichtungen automatisch generieren lassen? (Empfohlen)'
          ],
          DialogType.QUESTION
        )
      }).afterClosed().subscribe(result => {
        if (result) {
          this.addRandomWeights();
        }
      });
    }
  }

  get jobs(): Job[] {
    return this._jobs;
  }

}
