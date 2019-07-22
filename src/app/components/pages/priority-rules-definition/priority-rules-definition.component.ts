import {Component, OnInit, ViewChild} from '@angular/core';
import {CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {PriorityRule} from '../../../model/enums/PriorityRule';
import {StorageService} from '../../../services/storage.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-priority-rules-definition',
  templateUrl: './priority-rules-definition.component.html',
  styleUrls: ['./priority-rules-definition.component.css', '../pages-styles.css']
})
export class PriorityRulesDefinitionComponent implements OnInit {

  private _storedRules: PriorityRule[];
  private _otherRules: PriorityRule[];

  @ViewChild('storedList', {static: false}) private storedList: CdkDropList<PriorityRule[]>;
  @ViewChild('othersList', {static: false}) private othersList: CdkDropList<PriorityRule[]>;

  constructor(private storage: StorageService, private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.storedRules = this.storage.priorityRules;
    this.otherRules = Object.values(PriorityRule).filter(
      rule => !this.storedRules.includes(rule)
    );
  }

  drop(event: CdkDragDrop<PriorityRule[]>): void {
    this.changeArrays(
      event.previousContainer,
      event.container,
      event.previousIndex,
      event.currentIndex
    );
  }

  add(index: number): void {
    this.changeArrays(
      this.othersList,
      this.storedList,
      index,
      this.storedRules.length
    );
  }

  delete(index: number): void {
    this.changeArrays(
      this.storedList,
      this.othersList,
      index,
      this.otherRules.length
    );
  }

  private changeArrays(previousContainer: CdkDropList<PriorityRule[]>,
                       container: CdkDropList<PriorityRule[]>,
                       previousIndex: number,
                       currentIndex: number,
                       isMessageToBeHidden?: boolean): void {
    if (previousContainer !== container) {
      transferArrayItem(previousContainer.data, container.data, previousIndex, currentIndex);
      this.storage.priorityRules = this.storedRules;
    } else if (container === this.storedList && currentIndex !== previousIndex) {
      moveItemInArray(container.data, previousIndex, currentIndex);
      this.storage.priorityRules = this.storedRules;
    }
    if (!isMessageToBeHidden) {
      this.openSnackBar(previousContainer, container, previousIndex, currentIndex);
    }
  }

  private openSnackBar(previousContainer: CdkDropList<PriorityRule[]>,
                       container: CdkDropList<PriorityRule[]>,
                       previousIndex: number,
                       currentIndex: number) {
    let message: string;

    if (previousContainer !== container) {
      message = '\'' + container.data[currentIndex] + '\' ' +
        (container === this.storedList ? 'hinzugefügt' : 'entfernt');
    } else if (currentIndex !== previousIndex && container === this.storedList) {
      message = '\'' + container.data[currentIndex] + '\' an ' + (currentIndex + 1) + '. Stelle ' +
        (previousIndex > currentIndex ? '(nach vorne)' : '(nach hinten)') + ' gestellt';
    }

    if (message) {
      this.snackBar.open(message, 'Rückgängig',
        {panelClass: 'color-white', duration: 3000}
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
