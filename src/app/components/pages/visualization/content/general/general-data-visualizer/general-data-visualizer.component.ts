import {Component, Input} from '@angular/core';
import {VisualizableGeneralData} from '../../../../../../model/internal/visualization/SchedulingResult';
import {ObjectiveFunction} from '../../../../../../model/enums/ObjectiveFunction';

@Component({
  selector: 'app-general-data-visualizer',
  templateUrl: './general-data-visualizer.component.html',
  styleUrls: ['./general-data-visualizer.component.css', '../../../../pages-styles.css']
})
export class GeneralDataVisualizerComponent {

  @Input() data: VisualizableGeneralData;
  @Input() objectiveFunction: ObjectiveFunction;

  isDueDatesConsidered(): boolean {
    return (this.objectiveFunction === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || this.objectiveFunction === ObjectiveFunction.SUM_DELAYED_WORK
      || this.objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
      || this.objectiveFunction === ObjectiveFunction.MAX_DELAY);
  }

}
