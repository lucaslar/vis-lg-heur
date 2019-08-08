import {Component, Input, OnInit} from '@angular/core';
import {Kpi} from '../../../../../../model/internal/visualization/SchedulingResult';
import {StorageService} from '../../../../../../services/storage.service';
import {DefinableValue} from '../../../../../../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../../../../../../model/internal/value-definition/DefinitionStatus';

@Component({
  selector: 'app-solution-quality-data',
  templateUrl: './solution-quality-data.component.html',
  styleUrls: ['./solution-quality-data.component.css', '../../../../pages-styles.css']
})
export class SolutionQualityDataComponent implements OnInit {

  // TODO content: Add note that due dates where not considered in the calculation?

  @Input() data: Kpi[];
  @Input() isEachDueDateConfigured: boolean;

  ngOnInit(): void {
    this.data = this.data.filter(data => !!data);
  }

}
