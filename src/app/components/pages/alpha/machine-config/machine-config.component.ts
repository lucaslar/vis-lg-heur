import {Component, EventEmitter, Output} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {MachineNrPopupComponent} from '../../../dialogs/machine-nr-popup/machine-nr-popup.component';
import {MachineConfig} from '../../../../model/enums/MachineConfig';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';
import {DialogContent} from '../../../../model/internal/dialog/DialogContent';
import {DialogType} from '../../../../model/internal/dialog/DialogType';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-machine-config',
  templateUrl: './machine-config.component.html',
  styleUrls: ['./machine-config.component.css', '../../pages-styles.css']
})
export class MachineConfigComponent {

  /**
   * Emitter for a new machine number
   */
  @Output() machineNrChanged: EventEmitter<number> = new EventEmitter<number>();

  constructor(public storage: StorageService, private dialog: MatDialog) {
  }

  /**
   * Opens the machine pop up and returns emits a new selected number (if a new number was selected) after closing.
   */
  openMachinePopUp(): void {
    this.dialog.open(MachineNrPopupComponent).afterClosed().subscribe(result => {
      if (result) {
        this.machineNrChanged.emit(result);
      }
    });
  }

  /**
   * Opens a Pop-Up informing about the current machine configuration.
   */
  openMachinesDescription(): void {
    const currentCOnfiguration = this.storage.machineConfigParam;
    let configInWords: string;
    let whatDoesConfigMean: string | string[];

    if (currentCOnfiguration === MachineConfig.ONE_MACHINE) {
      configInWords = 'Es gibt genau eine Maschine';
      whatDoesConfigMean = [
        'Es kann nur einen Arbeitsgang an genau einer Maschine geben. Somit erübrigt es sich, ' +
        'die Reihenfolge der Arbeitsgänge zu vergleichen.',
        'Flow bzw. Job Shop setzen mindestens zwei Maschinen voraus. ' +
        'Erhöhen Sie die Anzahl an Maschinen, ergäbe sich ein Flow Shop.'];
    } else if (currentCOnfiguration === MachineConfig.FLOWSHOP) {
      configInWords = 'Flow Shop mit ' + this.storage.nrOfMachines + ' Maschinen';
      const machineOrderAsString = 'Erst ' +
        this.storage.jobs[0].machineTimes.map(mt => 'M. ' + mt.machineNr).join(', dann ') + '.';
      whatDoesConfigMean = [
        (this.storage.jobs.length > 1 ?
            'Die ' + this.storage.jobs[0].machineTimes.length + ' Arbeitsgänge aller ' + this.storage.jobs.length +
            ' Aufträge werden in derselben Reihenfolge ausgeführt, nämlich: '
            :
            'Da die Reihenfolge der ' + this.storage.jobs[0].machineTimes.length + ' Arbeitsgänge ' +
            'des aktuell einzigen Auftrags ' + 'nicht mit der Reihenfolge der Arbeitsgänge ' +
            'anderer Aufträge verglichen werden kann, liegt formal ein Flow Shop vor. ' +
            'Die (derzeit einzige) Reihenfolge der Arbeitsgänge ist: '
        ) +
        machineOrderAsString,
        (this.storage.jobs.length > 1 ?
            'Verschieben Sie '
            :
            'Fügen Sie mindestens einen Auftrag hinzu und verschieben anschließend '
        ) + 'die Arbeitsgänge eines Auftrags, entsteht ein Job Shop.'
      ];
    } else if (currentCOnfiguration === MachineConfig.JOBSHOP) {
      configInWords = 'Job Shop mit ' + this.storage.nrOfMachines + ' Maschinen';
      whatDoesConfigMean = [
        'Die Arbeitsgänge der ' + this.storage.jobs.length + ' Aufträge weisen nicht dieselbe Reihenfolge auf.',
        'Sorgen Sie dafür, dass die Reihenfolge der Arbeitsgänge aller Aufträge gleich ist, entsteht ein ' +
        'Flow Shop. Hierfür können Sie auch den dafür vorgesehenen Button unterhalb der Auftragseingabe nutzen.'
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
