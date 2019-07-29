import {Component, Input, OnInit} from '@angular/core';
import {Kpi} from '../../../../../../model/internal/visualization/SchedulingResult';
import {StorageService} from '../../../../../../services/storage.service';

@Component({
  selector: 'app-solution-quality-data',
  templateUrl: './solution-quality-data.component.html',
  styleUrls: ['./solution-quality-data.component.css', '../../../../pages-styles.css']
})
export class SolutionQualityDataComponent implements OnInit {

  @Input() data: Kpi[];

  private _isEachDueDateConfigured: boolean;

  constructor(public storage: StorageService) {
  }

  ngOnInit(): void {
    this.data = this.data.filter(data => !!data);
    this._isEachDueDateConfigured = this.storage.isEachDueDateCOnfigured();
  }

  get isEachDueDateConfigured(): boolean {
    return this._isEachDueDateConfigured;
  }
}
