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

  /**
   * Heuristic used in order to solve the scheduling problem
   */
  private _usedHeuristic: Heuristic;

  /**
   * Result containing displayable data after successful scheduling
   */
  private _result: SchedulingResult;


  /**
   * Represents whether the Gantt chart chapter is opened or closed
   */
  private _isGanttChartVisible = true;

  /**
   * Represents whether the general data chapter is opened or closed
   */
  private _isGeneralDataVisible = true;

  /**
   * Represents whether the solution quality chapter is opened or closed
   */
  private _isSolutionQualityDataVisible = true;

  /**
   * Represents whether the visualizable general data chapter is opened or closed
   */
  private _isVisualizableGeneralDataVisible = true;

  /**
   * Represents whether the visualizable solution quality chapter is opened or closed
   */
  private _isVisualizableSolutionQualityDataVisible = true;

  /**
   * Represents whether the heuristic procedure chapter is opened or closed
   */
  private _isHeuristicProcedureVisible = false;

  /**
   * Represents whether the machine tables chapter is opened or closed
   */
  private _isMachineTablesVisible = false;

  /**
   * Represents whether the scheduling log chapter is opened or closed
   */
  private _isLoggingVisible = false;

  constructor(public scheduling: SchedulingService,
              private activatedRoute: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog) {
  }

  /**
   * On initialization, by subscribing to the activatedRoute params, it is enabled to reload child components.
   * This means the user can choose to solve the problem with procedure B while on this page having used procedure A.
   *
   * In case of a complexity warning, the user is asked to confirm scheduling.
   */
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

  /**
   * Starts scheduling and thus sets the scheduling result. Wrapped inside setTimeout in order to
   * show spinner in case of longer calculations. (Timeout 0)
   *
   * @param heuristicDefiner Heuristic to be used for scheduling
   */
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
