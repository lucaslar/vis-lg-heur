import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateChild, Router} from '@angular/router';
import {StorageService} from '../services/storage.service';
import {MatDialog} from '@angular/material/dialog';
import {PopUpComponent} from '../components/dialogs/pop-up/pop-up.component';
import {DialogContent} from '../model/internal/dialog/DialogContent';
import {DialogType} from '../model/internal/dialog/DialogType';

/**
 * Guard to be used in order to protect each child page of beta.
 */
@Injectable({
  providedIn: 'root'
})
export class BetaEnoughJobsGuard implements CanActivateChild {

  constructor(private router: Router,
              public storage: StorageService,
              private dialog: MatDialog) {
  }

  /**
   * Checks if enough jobs (number specified in route data) are defined in order to open a child (beta) and returns this value.
   * If not, false is returned, the user cannot pass and a dialog is shown.
   *
   * @param route snapshot of the the current route
   * @returns true if enough jobs are defined in order to open a child (beta)
   */
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

      // Unfortunately, this line had to be added because of an Angular bug:
      // https://github.com/angular/angular/issues/16211 (last called: 22.07.2019)
      // Expected routing after no access if not called from an app page.
      // I presented this workaround under the issue on GitHub, see:
      // https://github.com/angular/angular/issues/16211#issuecomment-513915425
      this.router.navigate(<any[]><unknown>'');
    }
    return isEnoughJobsConfigured;
  }

  /**
   * @param configuredJobs Number of currently configured jobs
   * @param minJobsNeeded Minimum number of jobs that have to be configured in order to pass
   * @returns Information why passing is not possible
   */
  private getNoAccessText(configuredJobs: number, minJobsNeeded: number): string[] {
    return [
      'Für den Zugriff auf diese Option existieren derzeit ' +
      (configuredJobs ? 'zu wenige' : 'keine') + ' Aufträge.',
      'Bitte legen Sie daher ' + (configuredJobs ? 'weitere' : 'zunächst') + ' Aufträge an' +
      (minJobsNeeded > 1 ? ', um die Mindestanzahl von ' + minJobsNeeded + ' Aufträgen zu erfüllen. ' : '.')
    ];
  }
}
