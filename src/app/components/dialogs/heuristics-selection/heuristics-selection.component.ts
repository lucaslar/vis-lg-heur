import {Component, OnInit} from '@angular/core';
import {Heuristic} from '../../../model/scheduling/Heuristic';
import {HeuristicDefiner} from '../../../model/enums/HeuristicDefiner';
import {MatDialogRef} from '@angular/material/dialog';
import {StorageService} from '../../../services/storage.service';
import {DialogContent} from '../../../model/internal/dialog/DialogContent';

@Component({
  selector: 'app-heuristics-selection',
  templateUrl: './heuristics-selection.component.html',
  styleUrls: ['./heuristics-selection.component.css', '../shared-dialog-styles.css']
})
export class HeuristicsSelectionComponent implements OnInit {

  /**
   * Array of all implemented heuristics
   */
  private heuristcs: Heuristic[];

  /**
   * Map containing an heuristic as key and if not applicable the message why as value
   */
  private messagesMap: Map<Heuristic, string>;

  constructor(public storage: StorageService,
              private dialogRef: MatDialogRef<HeuristicsSelectionComponent>) {
  }

  /**
   * Initializes {messagesMap}.
   */
  ngOnInit() {
    this.messagesMap = new Map<Heuristic, string>();
  }

  /**
   * Closes this dialog.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Sets values for {messagesMap} (if not defined yet) and returns all implemented heuristics.
   *
   * @returns All heuristics to be listed
   */
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

  /**
   * @param heuristic Heuristic the message for is to be returned
   * @returns undefined in case of no error message, otherwise the error message listed in {messagesMap} is returned
   */
  getHeuristicMessage(heuristic: Heuristic): string | undefined {
    return this.messagesMap.get(heuristic);
  }

}
