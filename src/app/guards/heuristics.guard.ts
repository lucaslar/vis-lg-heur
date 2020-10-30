import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import {StorageService} from '../services/storage.service';
import {MatDialog} from '@angular/material/dialog';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {DialogType} from '../model/internal/dialog/DialogType';
import {PopUpComponent} from '../components/dialogs/pop-up/pop-up.component';
import {DialogContent} from '../model/internal/dialog/DialogContent';

/**
 * Guard to be used in order to protect the visualization page.
 */
@Injectable({
  providedIn: 'root'
})
export class HeuristicsGuard implements CanActivate {

  constructor(public storage: StorageService,
              private router: Router,
              private dialog: MatDialog) {
  }

  /**
   * Checks if the stated heuristic exists, is applicable and the current problem is not exactly solvable in a realistic amount of time
   * and returns this value. If not, false is returned, the user cannot pass and a dialog is shown.
   *
   * @param route Snapshot of the the current route
   * @returns true if the stated heuristic exists, is applicable and the current problem is not exactly solvable in a realistic amount of
   *          time
   */
  canActivate(route: ActivatedRouteSnapshot): boolean {

    const statedHeuristic = route.paramMap.get('heuristic');
    let responseDialog: DialogContent | undefined;

    // Check if stated heuristic exists in enum:
    if (Object.values(HeuristicDefiner).includes(statedHeuristic as HeuristicDefiner)) {
      const exactlySolvableInfo = this.storage.getMessageIfExactlySolvableProblem();
      responseDialog = exactlySolvableInfo !== undefined ? exactlySolvableInfo :
        <DialogContent | undefined> this.storage.isHeuristicApplicable(<HeuristicDefiner>statedHeuristic, true);
    } else {
      responseDialog = this.noSuchHeuristicDialog();
    }

    // no error or info dialog as feedback means the heuristic exists and is applicable:
    const isApplicableHeuristic = responseDialog === undefined;

    if (!isApplicableHeuristic) {
      this.dialog.open(PopUpComponent, {data: <DialogContent>responseDialog});
      // Unfortunately, this line had to be added because of an Angular bug:
      // https://github.com/angular/angular/issues/16211 (last called: 22.07.2019)
      // Expected routing after no access if not called from an app page.
      // I presented this workaround under the issue on GitHub, see:
      // https://github.com/angular/angular/issues/16211#issuecomment-513915425
      this.router.navigate(<any[]><unknown>'');
    }

    return isApplicableHeuristic;
  }

  /**
   * @return Content of the dialog to be shown if the heuristic stated in the route does not exist
   */
  private noSuchHeuristicDialog(): DialogContent {
    return new DialogContent(
      'Heuristik nicht bekannt',
      ['Anhand der eingegebenen Adresse konnte kein heuristisches Verfahren gefunden werden.'],
      DialogType.ERROR
    );
  }
}
