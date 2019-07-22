import {Component, OnInit, ViewChild} from '@angular/core';
import {CdkDragDrop, CdkDropList, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {PriorityRule} from '../../../model/enums/PriorityRule';
import {StorageService} from '../../../services/storage.service';

@Component({
  selector: 'app-priority-rules-definition',
  templateUrl: './priority-rules-definition.component.html',
  styleUrls: ['./priority-rules-definition.component.css', '../pages-styles.css']
})
export class PriorityRulesDefinitionComponent implements OnInit {

  private _storedRules: PriorityRule[];
  private _otherRules: PriorityRule[];

  @ViewChild('storedList', {static: false}) private storedList: CdkDropList<PriorityRule[]>;

  constructor(private storage: StorageService) {
  }

  ngOnInit(): void {
    this.storedRules = this.storage.priorityRules;
    this.otherRules = Object.values(PriorityRule).filter(
      rule => !this.storedRules.includes(rule)
    );
  }

  drop(event: CdkDragDrop<PriorityRule[]>) {
    if (event.previousContainer !== event.container) {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
      this.storage.priorityRules = this.storedRules;
    } else if (event.container === this.storedList) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.storage.priorityRules = this.storedRules;
    }
    // TODO: Message with 'undo'
    // Ignore sorting of other list
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
