import {Injectable} from '@angular/core';
import {StorageService} from '../services/storage.service';
import {CanActivate} from '@angular/router';
import {MatDialog} from '@angular/material';
import {InfoPopUpComponent} from '../components/dialogs/info-pop-up/info-pop-up.component';
import {DialogContent} from '../model/internal/DialogContent';
import {DialogType} from '../model/internal/DialogType';

@Injectable({
  providedIn: 'root'
})
export class JobsExistGuard implements CanActivate {

  constructor(private storage: StorageService, private dialog: MatDialog) {
  }

  canActivate(): boolean {
    const isJobsConfigured = this.storage.jobs.length > 0;
    if (!isJobsConfigured) {
      this.dialog.open(InfoPopUpComponent, {
        data: new DialogContent(
          'Kein Zugriff möglich',
          ['Derzeit sind keine Aufträge konfiguriert. Bitte legen Sie ' +
          'mindestens einen Auftrag an, um auf diese Funktion zugreifen zu können.'],
          DialogType.ERROR
        )
      });
    }
    return isJobsConfigured;
  }

}