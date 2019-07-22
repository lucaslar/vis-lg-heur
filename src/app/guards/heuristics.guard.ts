import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import {StorageService} from '../services/storage.service';
import {MatDialog} from '@angular/material';
import {HeuristicDefiner} from '../model/enums/HeuristicDefiner';
import {DialogType} from '../model/internal/DialogType';
import {PopUpComponent} from '../components/dialogs/pop-up/pop-up.component';
import {DialogContent} from '../model/internal/DialogContent';

@Injectable({
  providedIn: 'root'
})
export class HeuristicsGuard implements CanActivate {

  constructor(public storage: StorageService,
              private router: Router,
              private dialog: MatDialog) {
  }

  canActivate(route: ActivatedRouteSnapshot): boolean {

    const statedHeuristic = route.paramMap.get('heuristic');

    // Check if stated heuristic exists in enum:
    const errorDialog = Object.values(HeuristicDefiner).includes(statedHeuristic) ?
      this.storage.isHeuristicApplicableAndSet(<HeuristicDefiner>statedHeuristic, true) :
      this.noSuchHeuristicDialog();

    // no error dialog as feedback means the heuristic exists and is applicable:
    const isApplicableHeuristic = !errorDialog;

    if (!isApplicableHeuristic) {
      this.dialog.open(PopUpComponent, {data: <DialogContent>errorDialog});
      // Unfortunately, this line had to be added because of an Angular bug:
      // https://github.com/angular/angular/issues/16211 (last called: 22.07.2019)
      // Expected routing after no access if not called from an app page.
      // I presented this workaround under the issue on GitHub, see:
      // https://github.com/angular/angular/issues/16211#issuecomment-513915425
      this.router.navigate(<any[]><unknown>'');
    }

    return isApplicableHeuristic;
  }

  private noSuchHeuristicDialog(): DialogContent {
    return new DialogContent(
      'Heuristik nicht bekannt',
      ['Anhand der eingegebenen Adresse konnte kein heuristisches Verfahren gefunden werden.'],
      DialogType.ERROR
    );
  }
}
