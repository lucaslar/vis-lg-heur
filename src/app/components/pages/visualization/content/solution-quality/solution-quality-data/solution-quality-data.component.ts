import {Component, Input, OnInit} from '@angular/core';
import {Kpi} from '../../../../../../model/internal/visualization/SchedulingResult';
import {ObjectiveFunction} from '../../../../../../model/enums/ObjectiveFunction';

@Component({
  selector: 'app-solution-quality-data',
  templateUrl: './solution-quality-data.component.html',
  styleUrls: ['./solution-quality-data.component.css', '../../../../pages-styles.css']
})
export class SolutionQualityDataComponent implements OnInit {

  @Input() data: Kpi[];
  @Input() isEachDueDateConfigured: boolean;
  @Input() objectiveFunction: ObjectiveFunction;

  ngOnInit(): void {
    this.data = this.data.filter(data => !!data);
  }

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
