import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../services/storage.service';

@Component({
  selector: 'app-machine-nr-popup',
  templateUrl: './machine-nr-popup.component.html',
  styleUrls: ['./machine-nr-popup.component.css', '../shared-dialog-styles.css']
})
export class MachineNrPopupComponent implements OnInit {

  /**
   * Configured number of machines
   */
  private _machineNr: number;

  /**
   * Each possible number of machines
   */
  private _machines: number[];

  constructor(public storage: StorageService) {
  }

  /**
   * Initializes both the selected and all possible machine numbers
   */
  ngOnInit(): void {
    this.machineNr = this.storage.nrOfMachines;
    this._machines = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  }

  get machineNr(): number {
    return this._machineNr;
  }

  set machineNr(machineNr: number) {
    this._machineNr = machineNr;
  }

  get machines(): number[] {
    return this._machines;
  }

}
