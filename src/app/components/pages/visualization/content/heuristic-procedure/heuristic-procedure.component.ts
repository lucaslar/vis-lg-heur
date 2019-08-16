import {Component, Input} from '@angular/core';
import {HeuristicDefiner} from '../../../../../model/enums/HeuristicDefiner';
import {Heuristic} from '../../../../../model/scheduling/Heuristic';

@Component({
  selector: 'app-heuristic-procedure',
  templateUrl: './heuristic-procedure.component.html',
  styleUrls: ['./heuristic-procedure.component.css']
})
export class HeuristicProcedureComponent {

  /**
   * Heuristic more information about is to be shown
   */
  @Input() chosenHeuristic: Heuristic;

  /**
   * Stores all Enum values
   */
  private readonly _heuristic = HeuristicDefiner;

  get heuristic(): any {
    return this._heuristic;
  }
}
