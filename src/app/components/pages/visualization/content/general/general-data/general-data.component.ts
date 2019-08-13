import {Component, Input} from '@angular/core';
import {GeneralSchedulingData} from '../../../../../../model/internal/visualization/SchedulingResult';
import {Heuristic} from '../../../../../../model/scheduling/Heuristic';
import {MachineConfig} from '../../../../../../model/enums/MachineConfig';

@Component({
  selector: 'app-general-data',
  templateUrl: './general-data.component.html',
  styleUrls: ['./general-data.component.css', '../../../../pages-styles.css']
})
export class GeneralDataComponent {

  @Input() data: GeneralSchedulingData;
  @Input() heuristic: Heuristic;

  private readonly _machineCongig = MachineConfig;


  get machineCongig(): any {
    return this._machineCongig;
  }

  getListedPriorityRules() {
    return this.data.priorityRules.map(pRule => '"' + pRule + '"').join(', ');
  }
}
