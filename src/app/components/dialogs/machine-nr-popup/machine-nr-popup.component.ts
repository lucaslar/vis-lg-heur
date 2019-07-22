import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../services/storage.service';

@Component({
  selector: 'app-machine-nr-popup',
  templateUrl: './machine-nr-popup.component.html',
  styleUrls: ['./machine-nr-popup.component.css', '/../shared-dialog-styles.css']
})
export class MachineNrPopupComponent implements OnInit {

  machineNr: number;
  machines: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(public storage: StorageService) {
  }

  ngOnInit(): void {
    this.machineNr = this.storage.nrOfMachines;
  }

}
