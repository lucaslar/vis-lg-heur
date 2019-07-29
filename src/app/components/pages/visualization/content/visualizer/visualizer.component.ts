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

  // TODO: (Generally) Readonly -> Upper case

  private _result: SchedulingResult;

  private _isGeneralDataVisible = true;
  private _isSolutionQualityDataVisible = true;
  private _isVisualizableGeneralDataVisible = true;
  private _isVisualizableSolutionQualityDataVisible = true;

  constructor(public scheduling: SchedulingService,
              private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    const heuristicDefiner = <HeuristicDefiner>this.route.snapshot.paramMap.get('heuristic');
    this._result = this.scheduling.scheduleUsingHeuristic(heuristicDefiner);
  }

  get result(): SchedulingResult {
    return this._result;
  }

  get isGeneralDataVisible(): boolean {
    return this._isGeneralDataVisible;
  }

  set isGeneralDataVisible(value: boolean) {
    this._isGeneralDataVisible = value;
  }

  get isSolutionQualityDataVisible(): boolean {
    return this._isSolutionQualityDataVisible;
  }

  set isSolutionQualityDataVisible(value: boolean) {
    this._isSolutionQualityDataVisible = value;
  }

  get isVisualizableGeneralDataVisible(): boolean {
    return this._isVisualizableGeneralDataVisible;
  }

  set isVisualizableGeneralDataVisible(value: boolean) {
    this._isVisualizableGeneralDataVisible = value;
  }

  get isVisualizableSolutionQualityDataVisible(): boolean {
    return this._isVisualizableSolutionQualityDataVisible;
  }

  set isVisualizableSolutionQualityDataVisible(value: boolean) {
    this._isVisualizableSolutionQualityDataVisible = value;
  }
}
