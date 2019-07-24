import {Component, OnInit} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {SchedulingService} from '../../../../services/scheduling.service';
import {ActivatedRoute} from '@angular/router';
import {Heuristic} from '../../../../model/Heuristic';
import {HeuristicDefiner} from '../../../../model/enums/HeuristicDefiner';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css', '../../pages-styles.css']
})
export class VisualizerComponent implements OnInit {

  constructor(public storage: StorageService,
              public scheduling: SchedulingService,
              private route: ActivatedRoute) {
  }

  private _heuristic: Heuristic;
  private _isLoading: boolean;

  ngOnInit() {
    const heuristicDefiner = <HeuristicDefiner>this.route.snapshot.paramMap.get('heuristic');
    this.heuristic = Heuristic.getHeuristicByDefiner(heuristicDefiner);

    this.isLoading = true;
    this.scheduling.scheduleUsingHeuristic(heuristicDefiner);
    this.isLoading = false;
  }

  get heuristic(): Heuristic {
    return this._heuristic;
  }

  set heuristic(heuristic: Heuristic) {
    this._heuristic = heuristic;
  }

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(isLoading: boolean) {
    this._isLoading = isLoading;
  }

}
