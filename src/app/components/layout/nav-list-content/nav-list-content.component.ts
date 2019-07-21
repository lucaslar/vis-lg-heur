import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-nav-list-content',
  templateUrl: './nav-list-content.component.html',
  styleUrls: ['./nav-list-content.component.css']
})
export class NavListContentComponent {

  @Output() tapEmitter: EventEmitter<boolean> = new EventEmitter();

  onListItemTapped(): void {
    this.tapEmitter.emit(true);
  }

}
