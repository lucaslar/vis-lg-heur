import {Component, OnInit} from '@angular/core';
import {SchedulingService} from '../../../../services/scheduling.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HeuristicDefiner} from '../../../../model/enums/HeuristicDefiner';
import {SchedulingResult} from '../../../../model/internal/visualization/SchedulingResult';
import {Heuristic} from '../../../../model/scheduling/Heuristic';
import {PopUpComponent} from '../../../dialogs/pop-up/pop-up.component';
import {MatDialog} from '@angular/material';

@Component({
  selector: 'app-visualizer',
  templateUrl: './visualizer.component.html',
  styleUrls: ['./visualizer.component.css', '../../pages-styles.css']
})
export class VisualizerComponent implements OnInit {

  private _usedHeuristic: Heuristic;
  private _result: SchedulingResult;

  private _isGanttChartVisible = true;
  private _isGeneralDataVisible = true;
  private _isSolutionQualityDataVisible = true;
  private _isVisualizableGeneralDataVisible = true;
  private _isVisualizableSolutionQualityDataVisible = true;
  private _isHeuristicProcedureVisible = false;
  private _isMachineTablesVisible = false;
  private _isLoggingVisible = false;

  constructor(public scheduling: SchedulingService,
              private activatedRoute: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.activatedRoute.params.subscribe(() => {
      const heuristicDefiner = <HeuristicDefiner>this.activatedRoute.snapshot.paramMap.get('heuristic');
      if (!this.usedHeuristic || this.usedHeuristic.heuristicDefiner !== heuristicDefiner) {
        this._usedHeuristic = Heuristic.getHeuristicByDefiner(heuristicDefiner);
        this._result = undefined;

        const complexityWarning = this.scheduling.getComplexityWarning(heuristicDefiner);

        if (complexityWarning) {
          this.dialog.open(PopUpComponent, {data: complexityWarning}).afterClosed().subscribe(result => {
            if (result) {
              this.startScheduling(heuristicDefiner);
            } else {
              this.router.navigate(['']);
            }
          });
        } else {
          this.startScheduling(heuristicDefiner);
        }
      }
    });
  }

  private startScheduling(heuristicDefiner: HeuristicDefiner): void {
    setTimeout(() => this._result = this.scheduling.scheduleUsingHeuristic(heuristicDefiner), 0);
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

  get isHeuristicProcedureVisible(): boolean {
    return this._isHeuristicProcedureVisible;
  }

  set isHeuristicProcedureVisible(value: boolean) {
    this._isHeuristicProcedureVisible = value;
  }

  get isMachineTablesVisible(): boolean {
    return this._isMachineTablesVisible;
  }

  set isMachineTablesVisible(value: boolean) {
    this._isMachineTablesVisible = value;
  }

  get isLoggingVisible(): boolean {
    return this._isLoggingVisible;
  }

  set isLoggingVisible(value: boolean) {
    this._isLoggingVisible = value;
  }

  get usedHeuristic(): Heuristic {
    return this._usedHeuristic;
  }
}
