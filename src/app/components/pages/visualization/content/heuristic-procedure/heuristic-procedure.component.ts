import {Component, Input} from '@angular/core';
import {HeuristicDefiner} from '../../../../../model/enums/HeuristicDefiner';
import {Heuristic} from '../../../../../model/Heuristic';

@Component({
  selector: 'app-heuristic-procedure',
  templateUrl: './heuristic-procedure.component.html',
  styleUrls: ['./heuristic-procedure.component.css']
})
export class HeuristicProcedureComponent {

  @Input() chosenHeuristic: Heuristic;

  private readonly _heuristic = HeuristicDefiner;

  get heuristic(): HeuristicDefiner {
    return this._heuristic;
  }
}
