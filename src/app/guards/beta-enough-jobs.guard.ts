import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, Router} from '@angular/router';
import {StorageService} from '../services/storage.service';
import {MatDialog} from '@angular/material';
import {PopUpComponent} from '../components/dialogs/pop-up/pop-up.component';
import {DialogContent} from '../model/internal/DialogContent';
import {DialogType} from '../model/internal/DialogType';
import {min} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BetaEnoughJobsGuard implements CanActivateChild {

  constructor(private router: Router,
              private storage: StorageService,
              private dialog: MatDialog) {
  }

  canActivateChild(route: ActivatedRouteSnapshot): boolean {

    const minJobsNeeded = route.data.minJobs as number;
    const isEnoughJobsConfigured = this.storage.jobs.length >= minJobsNeeded;

    if (!isEnoughJobsConfigured) {
      this.dialog.open(PopUpComponent, {
        data: new DialogContent(
          (this.storage.jobs.length ? 'Zu wenige' : 'Keine') + ' Aufträge konfiguriert',
          this.getNoAccessText(this.storage.jobs.length, minJobsNeeded),
          DialogType.ERROR,
        )
      });

      // Unfortunately, this line had to be added because of Angular bug:
      // https://github.com/angular/angular/issues/16211 (last called: 22.07.2019)
      // Doing what Guard is expected to do (no errors due to casting/unknown declaration).
      this.router.navigate(<any[]><unknown>'');
    }
    return isEnoughJobsConfigured;
  }

  private getNoAccessText(configuredJobs: number, minJobsNeeded: number): string[] {
    return [
      'Für den Zugriff auf diese Option existieren derzeit ' +
      (configuredJobs ? 'zu wenige' : 'keine') + ' Aufträge.',
      'Bitte legen Sie daher ' + (configuredJobs ? 'weitere' : 'zunächst') + ' Aufträge an' +
      (minJobsNeeded > 1 ? ', um die Mindestanzahl von ' + minJobsNeeded + ' Aufträgen zu erfüllen. ' : '.')
    ];
  }
}
