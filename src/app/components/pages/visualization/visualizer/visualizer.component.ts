import {Component, OnInit} from '@angular/core';
import {SchedulingService} from '../../../../services/scheduling.service';
import {ActivatedRoute} from '@angular/router';
import {HeuristicDefiner} from '../../../../model/enums/HeuristicDefiner';
import {SchedulingResult} from '../../../../model/internal/visualization/SchedulingResult';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css', '../../pages-styles.css']
})
export class VisualizerComponent implements OnInit {

  private _result: SchedulingResult;

  private _isGanttChartVisible = true;
  private _isGeneralDataVisible = true;
  private _isSolutionQualityDataVisible = true;
  private _isVisualizableGeneralDataVisible = true;
  private _isVisualizableSolutionQualityDataVisible = true;
  private _isLoggingShown = false;

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

  get isGanttChartVisible(): boolean {
    return this._isGanttChartVisible;
  }

  set isGanttChartVisible(value: boolean) {
    this._isGanttChartVisible = value;
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

  get isLoggingShown(): boolean {
    return this._isLoggingShown;
  }

  set isLoggingShown(value: boolean) {
    this._isLoggingShown = value;
  }
}
