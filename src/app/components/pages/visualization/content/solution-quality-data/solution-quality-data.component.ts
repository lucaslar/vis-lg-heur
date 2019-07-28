import {Component, Input, OnInit} from '@angular/core';
import {Kpi} from '../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-solution-quality-data',
  templateUrl: './solution-quality-data.component.html',
  styleUrls: ['./solution-quality-data.component.css', '../../../pages-styles.css']
})
export class SolutionQualityDataComponent implements OnInit {

  @Input() data: Kpi[];

  ngOnInit(): void {
    this.data = this.data.filter(data => !!data);
  }

}
