import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {Order} from '../../../model/Order';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.css']
})
export class OrderComponent {

  @Input() order: Order;
  @Output() deleteEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() copyEmitter: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('accordion', {static: false}) accordion: ElementRef;
  @ViewChild('panel', {static: false}) panel: ElementRef;
  @ViewChild('button_expand_collapse', {static: false}) button: ElementRef;

  private isShown = false;

  showOrHideOrder(): void {
    this.accordion.nativeElement.classList.toggle('active');
    this.button.nativeElement.classList.toggle('active');

    if (this.panel.nativeElement.style.maxHeight) {
      this.panel.nativeElement.style.maxHeight = null;
      this.isShown = false;
    } else {
      this.panel.nativeElement.style.maxHeight = this.panel.nativeElement.scrollHeight + 'px';
      this.isShown = true;
    }
  }

  closePanel(): void {
    if (this.isShown) {
      this.showOrHideOrder();
    }
  }

  deleteOrder() {
    this.deleteEmitter.emit(true);
  }

  copyOrder() {
    this.showOrHideOrder();
    this.copyEmitter.emit(true);
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.order.machineOrder, event.previousIndex, event.currentIndex);
  }

}
