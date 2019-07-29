import {Component, Input} from '@angular/core';
import {VisualizableGeneralData} from '../../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-general-data-visualizer',
  templateUrl: './general-data-visualizer.component.html',
  styleUrls: ['./general-data-visualizer.component.css', '../../../../pages-styles.css']
})
export class GeneralDataVisualizerComponent {

  @Input() data: VisualizableGeneralData;

}
