import {Component, Input} from '@angular/core';
import {VisualizableSolutionQualityData} from '../../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-solution-quality-visualizer',
  templateUrl: './solution-quality-visualizer.component.html',
  styleUrls: ['./solution-quality-visualizer.component.css', '../../../../pages-styles.css']
})
export class SolutionQualityVisualizerComponent {

  @Input() data: VisualizableSolutionQualityData;

}
