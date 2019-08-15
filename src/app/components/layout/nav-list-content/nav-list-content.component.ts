import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-nav-list-content',
  templateUrl: './nav-list-content.component.html',
  styleUrls: ['./nav-list-content.component.css']
})
export class NavListContentComponent {

  /**
   * Emitter used for events concerning tapping/clicking on the items of the navigation list
   */
  @Output() tapEmitter: EventEmitter<boolean> = new EventEmitter();

  /**
   * Emits true if a list item has been tapped/clicked on
   */
  onListItemTapped(): void {
    this.tapEmitter.emit(true);
  }

}
