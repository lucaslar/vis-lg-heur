import {Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {PriorityRule} from '../../../model/enums/PriorityRule';

@Component({
  selector: 'app-priority-rules-definition',
  templateUrl: './priority-rules-definition.component.html',
  styleUrls: ['./priority-rules-definition.component.css', '../pages-styles.css']
})
export class PriorityRulesDefinitionComponent implements OnInit {

  storedRules: PriorityRule[];
  otherRules: PriorityRule[];

  ngOnInit(): void {
  }

  drop(event: CdkDragDrop<PriorityRule[]>): void {
    if (event.container === event.previousContainer) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else if (event.container !== event.previousContainer) {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

}
