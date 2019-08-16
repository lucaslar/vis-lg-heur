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

  /**
   * Data to be shown in the component
   */
  @Input() data: GeneralSchedulingData;

  /**
   * Heuristic used for scheduling
   */
  @Input() heuristic: Heuristic;

  /**
   * Stores all Enum values
   */
  private readonly _machineCongig = MachineConfig;

  /**
   * @returns Selected priority rules as one string.
   */
  getListedPriorityRules() {
    return this.data.priorityRules.map(pRule => '"' + pRule + '"').join(', ');
  }

  get machineCongig(): any {
    return this._machineCongig;
  }
}
