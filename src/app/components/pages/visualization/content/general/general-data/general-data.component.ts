import {Component, Input} from '@angular/core';
import {GeneralSchedulingData} from '../../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-general-data',
  templateUrl: './general-data.component.html',
  styleUrls: ['./general-data.component.css', '../../../../pages-styles.css']
})
export class GeneralDataComponent {

  @Input() data: GeneralSchedulingData;

}
