import {Component, OnInit, ViewChild} from '@angular/core';
import {CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {PriorityRule} from '../../../model/enums/PriorityRule';
import {StorageService} from '../../../services/storage.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-priority-rules-definition',
  templateUrl: './priority-rules-definition.component.html',
  styleUrls: ['./priority-rules-definition.component.css', '../pages-styles.css']
})
export class PriorityRulesDefinitionComponent implements OnInit {

  /**
   * List of priority rules stored by the user
   */
  private _storedRules: PriorityRule[];

  /**
   * List of priority rules not stored by the user
   */
  private _otherRules: PriorityRule[];


  /**
   * Reference to the list of stored priority rules
   */
  @ViewChild('storedList', {static: false}) private storedList: CdkDropList<PriorityRule[]>;

  /**
   * Reference to the list of other priority rules
   */
  @ViewChild('othersList', {static: false}) private othersList: CdkDropList<PriorityRule[]>;

  constructor(public storage: StorageService, private snackBar: MatSnackBar) {
  }

  /**
   * Initializes stored and not stored priority rules.
   */
  ngOnInit(): void {
    this.storedRules = this.storage.priorityRules;
    this.otherRules = Object.values(PriorityRule).filter(
      rule => !this.storedRules.includes(rule)
    );
  }

  /**
   * Calls method to change arrays on dropping.
   *
   * @param event Dropping event
   */
  drop(event: CdkDragDrop<PriorityRule[]>): void {
    this.changeArrays(
      event.previousContainer,
      event.container,
      event.previousIndex,
      event.currentIndex
    );
  }

  /**
   * Adds a priority rule to the list of stored priority rules.
   *
   * @param index Index of the priority rule to be added (in list: "others")
   */
  add(index: number): void {
    this.changeArrays(
      this.othersList,
      this.storedList,
      index,
      this.storedRules.length
    );
  }

  /**
   * Deletes a priority rule from the list of stored priority rules.
   *
   * @param index Index of the priority rule to be deleted (in list: "stored")
   */
  delete(index: number): void {
    this.changeArrays(
      this.storedList,
      this.othersList,
      index,
      this.otherRules.length
    );
  }

  /**
   * Changes array(s) either by changing or by sorting content. Possible/allowed actions:
   * - Sorting of stored priority rules
   * - Drag and drop for adding rules
   * - Drag and drop for deleting rules
   *
   * Thus, sorting the array of other priority rules is not allowed.
   *
   * @param previousContainer Outgoing list (can be the same as container)
   * @param container Receiving list (can be the same as previousContainer)
   * @param previousIndex Index of item in outgoing list
   * @param currentIndex Index of item in receiving list (dropped position)
   * @param isMessageToBeHidden (optional) if true, no snackbars will be shown after performing the action
   */
  private changeArrays(previousContainer: CdkDropList<PriorityRule[]>,
                       container: CdkDropList<PriorityRule[]>,
                       previousIndex: number,
                       currentIndex: number,
                       isMessageToBeHidden?: boolean): void {
    if (previousContainer !== container && container === this.storedList) {
      transferArrayItem(previousContainer.data, container.data, previousIndex, currentIndex);
      this.storage.priorityRules = this.storedRules;

    } else if (previousContainer !== container && container === this.othersList) {
      const newIndex = Object.values(PriorityRule)
        .filter(priorityRule => priorityRule === this.storedList.data[previousIndex] || this.othersList.data.includes(priorityRule))
        .indexOf(previousContainer.data[previousIndex]);
      transferArrayItem(previousContainer.data, container.data, previousIndex, newIndex);
      this.storage.priorityRules = this.storedRules;

    } else if (container === this.storedList && currentIndex !== previousIndex) {
      moveItemInArray(container.data, previousIndex, currentIndex);
      this.storage.priorityRules = this.storedRules;
    }
    if (!isMessageToBeHidden) {
      this.openSnackBar(previousContainer, container, previousIndex, currentIndex);
    }
  }

  /**
   * Opens a snackbar informing about a performed action and allowing to undo actions.
   *
   * @param previousContainer Outgoing list (can be the same as container)
   * @param container Receiving list (can be the same as previousContainer)
   * @param previousIndex Index of item in outgoing list
   * @param currentIndex Index of item in receiving list (dropped position)
   */
  private openSnackBar(previousContainer: CdkDropList<PriorityRule[]>,
                       container: CdkDropList<PriorityRule[]>,
                       previousIndex: number,
                       currentIndex: number) {
    let message: string;

    if (previousContainer !== container) {
      message = '\'' + container.data[currentIndex] + '\' ' +
        (container === this.storedList ? ' an ' + (currentIndex + 1) + '. Stelle hinzugefügt' : 'entfernt');
    } else if (currentIndex !== previousIndex && container === this.storedList) {
      message = '\'' + container.data[currentIndex] + '\' an ' + (currentIndex + 1) + '. Stelle ' +
        (previousIndex > currentIndex ? '(nach vorne)' : '(nach hinten)') + ' gestellt';
    }

    if (message) {
      this.snackBar.open(message, 'Rückgängig',
        {panelClass: 'color-white', duration: 2000}
      ).onAction().subscribe(() => {
        // reverse event
        this.changeArrays(container, previousContainer, currentIndex, previousIndex, true);
      });
    }
  }


  get storedRules(): PriorityRule[] {
    return this._storedRules;
  }

  set storedRules(storedRules: PriorityRule[]) {
    this._storedRules = storedRules;
  }

  get otherRules(): PriorityRule[] {
    return this._otherRules;
  }

  set otherRules(otherRules: PriorityRule[]) {
    this._otherRules = otherRules;
  }

}
