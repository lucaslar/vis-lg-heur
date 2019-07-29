import {Component, OnInit} from '@angular/core';
import {SchedulingService} from '../../../../../services/scheduling.service';
import {ActivatedRoute} from '@angular/router';
import {HeuristicDefiner} from '../../../../../model/enums/HeuristicDefiner';
import {SchedulingResult} from '../../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css', '../../../pages-styles.css']
})
export class VisualizerComponent implements OnInit {

  private _result: SchedulingResult;

  constructor(public scheduling: SchedulingService,
              private route: ActivatedRoute) {
  }

  ngOnInit() {
    const heuristicDefiner = <HeuristicDefiner>this.route.snapshot.paramMap.get('heuristic');
    this._result = this.scheduling.scheduleUsingHeuristic(heuristicDefiner);
  }

  get result(): SchedulingResult {
    return this._result;
  }
}
