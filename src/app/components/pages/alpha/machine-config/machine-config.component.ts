import {Component, EventEmitter, Output} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {MachineNrPopupComponent} from '../../../dialogs/machine-nr-popup/machine-nr-popup.component';
import {MachineConfig} from '../../../../model/enums/MachineConfig';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';
import {DialogContent} from '../../../../model/internal/dialog/DialogContent';
import {DialogType} from '../../../../model/internal/dialog/DialogType';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-machine-config',
  templateUrl: './machine-config.component.html',
  styleUrls: ['./machine-config.component.css', '../../pages-styles.css']
})
export class MachineConfigComponent {

  @Output() machineNrChanged: EventEmitter<number> = new EventEmitter<number>();

  constructor(public storage: StorageService, private dialog: MatDialog) {
  }

  openMachinePopUp(): void {
    this.dialog.open(MachineNrPopupComponent).afterClosed().subscribe(result => {
      if (result) {
        this.machineNrChanged.emit(result);
      }
    });
  }

  openMachinesDescription(): void {
    const currentCOnfiguration = this.storage.machineConfigParam;
    let configInWords: string;
    let whatDoesConfigMean: string | string[];

    if (currentCOnfiguration === MachineConfig.ONE_MACHINE) {
      configInWords = 'Es gibt genau eine Maschine';
      whatDoesConfigMean = [
        'Es kann nur einen Arbeitsgang an genau einer Maschine geben. Somit erübigt es sich, ' +
        'einen Vergleich der Reihenfolge der Arbeitsgänge zu ziehen.',
        'Flow- bzw. Jobshop setzen mindestens zwei Maschinen voraus. ' +
        'Erhöhen Sie die Anzahl an Maschinen, ergäbe sich ein Flowshop.'];
    } else if (currentCOnfiguration === MachineConfig.FLOWSHOP) {
      configInWords = 'Flowshop mit ' + this.storage.nrOfMachines + ' Maschinen';
      let machineOrderAsString = 'Erst M. ';
      this.storage.jobs[0].machineTimes.map(m => m.machineNr).forEach(
        machineNr => machineOrderAsString += machineNr + (
          this.storage.jobs[0].machineTimes.findIndex(m => m.machineNr === machineNr) === this.storage.nrOfMachines - 1 ?
            '.' : ', dann M. '
        )
      );
      whatDoesConfigMean = [
        (this.storage.jobs.length > 1 ?
            'Die ' + this.storage.jobs[0].machineTimes.length + ' Arbeitsgänge aller ' + this.storage.jobs.length +
            ' Aufträge werden in derselben Reihenfolge ausgeführt, nämlich: '
            :
            'Da die Reihenfolge der ' + this.storage.jobs[0].machineTimes.length + ' Arbeitsgänge ' +
            'des aktuell einzigen Auftrags ' + 'nicht mit der Reihenfolge der Arbeitsgänge ' +
            'anderer Aufträge verglichen werden kann, liegt formal ein Flowshop vor. ' +
            'Die (derzeit einzige) Reihenfolge der Arbeitsgänge ist: '
        ) +
        machineOrderAsString,
        (this.storage.jobs.length > 1 ?
            'Verschieben Sie '
            :
            'Fügen Sie mindestens einen Auftrag hinzu und verschieben anschließend '
        ) + 'die Arbeitsgänge eines Auftrags, entsteht ein Jobshop.'
      ];
    } else if (currentCOnfiguration === MachineConfig.JOBSHOP) {
      configInWords = 'Jobshop mit ' + this.storage.nrOfMachines + ' Maschinen';
      whatDoesConfigMean = [
        'Die Arbeitsgänge der ' + this.storage.jobs.length + ' Aufträge weisen nicht dieselbe Reihenfolge auf.',
        'Sorgen Sie dafür, dass die Reihenfolge der Arbeitsgänge aller Aufträge gleich ist, entsteht ein ' +
        'Flowshop. Hierfür können Sie auch den dafür vorgesehenen Button unterhalb der Auftragseingabe nutzen.'
      ];
    } else {
      configInWords = 'Aussage nicht möglich';
      whatDoesConfigMean = [
        'Es sind keine Aufträge definiert, daher kann die Maschinenumgebung nicht ' +
        'spezifiziert werden.',
        'Fügen Sie bitte mindestens einen Auftrag hinzu.'
      ];
    }

    const texts = [
      'Aktuelle Maschinenumgebung: ' +
      configInWords + '.'
    ];
    texts.push(...whatDoesConfigMean);

    this.dialog.open(PopUpComponent, {
      data: new DialogContent(
        'Maschinenumgebung',
        texts,
        DialogType.INFO
      )
    });
  }

}
