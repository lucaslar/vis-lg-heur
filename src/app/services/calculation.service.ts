import {Injectable} from '@angular/core';
import {DialogContent} from '../model/internal/DialogContent';
import {StorageService} from './storage.service';
import {DialogType} from '../model/internal/DialogType';
import {MachineConfig} from '../model/enums/MachineConfig';

@Injectable({
  providedIn: 'root'
})
export class CalculationService {

  constructor(private storage: StorageService) {
  }

  getMessageIfExactlySolvableProblem(): DialogContent | undefined {

    // TODO: Implement case: Exactly solvable but more than 2 machines!
    // TODO Check Gamma after gamma being stored in StorageService.

    // TODO: Do always return undefined for comparing priority rules to previous project
    return this.storage.nrOfMachines === 2 ?
      new DialogContent(
        'Reihenfolgeproblem exakt lösbar',
        [
          'Das aktuelle Reihenfolgeproblem (' + (this.storage.machineConfigParam === MachineConfig.FLOWSHOP ?
            'Flowshop' : 'Jobshop') + ' mit zwei Maschinen) ist mithilfe des ' +
          'Johnson-Algorithmus in vertretbarer Zeit exakt lösbar.',
          // TODO Correct calculating time?
          'Der Rechenaufwand beträgt hierbei O(n log n). Es besteht also kein Bedarf, ein ' +
          'heuristisches Verfahren zu verwenden.'
        ],
        DialogType.INFO
      ) : undefined;
  }
}
