import {Component, Input} from '@angular/core';
import {MachineTableData} from '../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-machine-tables',
  templateUrl: './machine-tables.component.html',
  styleUrls: ['./machine-tables.component.css', '../../../pages-styles.css']
})
export class MachineTablesComponent {

  // TODO: Add ... if no production?
  // TODO: get colour from charts?
  @Input() data: MachineTableData[];

}
