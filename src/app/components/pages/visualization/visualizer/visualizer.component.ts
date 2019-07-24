import {Component, OnInit} from '@angular/core';
import {SchedulingService} from '../../../../services/scheduling.service';
import {ActivatedRoute} from '@angular/router';
import {HeuristicDefiner} from '../../../../model/enums/HeuristicDefiner';
import {SchedulingResult} from '../../../../model/internal/SchedulingResult';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css', '../../pages-styles.css']
})
export class VisualizerComponent implements OnInit {

  constructor(public scheduling: SchedulingService,
              private route: ActivatedRoute) {
  }

  private _result: SchedulingResult;

  ngOnInit() {
    const heuristicDefiner = <HeuristicDefiner>this.route.snapshot.paramMap.get('heuristic');
    this._result = this.scheduling.scheduleUsingHeuristic(heuristicDefiner);
    console.log(this._result.generalData);
    console.log(this._result.solutionQualityData);
    console.log(this._result.visualizableSolutionQualityData);
  }

  get result(): SchedulingResult {
    return this._result;
  }

}
