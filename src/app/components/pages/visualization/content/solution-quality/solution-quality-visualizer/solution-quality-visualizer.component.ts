import {Component, Input} from '@angular/core';
import {VisualizableSolutionQualityData} from '../../../../../../model/internal/visualization/SchedulingResult';
import {ObjectiveFunction} from '../../../../../../model/enums/ObjectiveFunction';

@Component({
  selector: 'app-solution-quality-visualizer',
  templateUrl: './solution-quality-visualizer.component.html',
  styleUrls: ['./solution-quality-visualizer.component.css', '../../../../pages-styles.css']
})
export class SolutionQualityVisualizerComponent {

  @Input() data: VisualizableSolutionQualityData;
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
