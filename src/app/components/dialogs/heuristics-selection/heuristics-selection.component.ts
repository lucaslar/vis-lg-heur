import {Component, OnInit} from '@angular/core';
import {Heuristic} from '../../../model/Heuristic';
import {HeuristicDefiner} from '../../../model/enums/HeuristicDefiner';
import {MatDialogRef} from '@angular/material';
import {StorageService} from '../../../services/storage.service';
import {DialogContent} from '../../../model/internal/dialog/DialogContent';

@Component({
  selector: 'app-heuristics-selection',
  templateUrl: './heuristics-selection.component.html',
  styleUrls: ['./heuristics-selection.component.css', '../shared-dialog-styles.css']
})
export class HeuristicsSelectionComponent implements OnInit {

  private heuristcs: Heuristic[];
  private messagesMap: Map<Heuristic, string>;

  constructor(public storage: StorageService,
              private dialogRef: MatDialogRef<HeuristicsSelectionComponent>) {
  }

  ngOnInit() {
    this.messagesMap = new Map<Heuristic, string>();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getHeuristics(): Heuristic[] {
    if (!this.heuristcs) {
      this.heuristcs = Object.values(HeuristicDefiner).map(definer => {
        const heuristic = Heuristic.getHeuristicByDefiner(definer);
        const possibleDialog = this.storage.isHeuristicApplicable(definer, true);
        if (possibleDialog !== undefined) {
          this.messagesMap.set(heuristic, (<DialogContent>possibleDialog).header);
        }
        return heuristic;
      }).sort(((h1, h2) => {
          // Casting boolean 'text exists' to number in order to shorten sort-method
          return +!!this.messagesMap.get(h1) -
            +!!this.messagesMap.get(h2);
        })
      );

    }
    return this.heuristcs;
  }

  getHeuristicMessage(heuristic: Heuristic): string | undefined {
    return this.messagesMap.get(heuristic);
  }

}
