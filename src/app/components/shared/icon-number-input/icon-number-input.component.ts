import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'app-icon-number-input',
  templateUrl: './icon-number-input.component.html',
  styleUrls: ['./icon-number-input.component.css']
})
export class IconNumberInputComponent implements OnInit {

  @ViewChild('inputField', {static: false}) inputFieldRef: ElementRef;
  @ViewChild('icon', {static: true}) icon: ElementRef;

  @Input() readonly iconClasses: string[];
  @Input() readonly min: number;
  @Input() readonly max: number;
  @Input() readonly value: number;

  @Output() newValue: EventEmitter<number> = new EventEmitter();

  ngOnInit(): void {
    this.iconClasses.forEach(
      className => (<HTMLElement>this.icon.nativeElement).classList.add(className)
    );
  }

  onNumberChange(): void {
    const inputField: HTMLInputElement = this.inputFieldRef.nativeElement;
    const value = +inputField.value;
    if (value) {
      inputField.value = (value).toString();
      this.newValue.emit(value);
    } else {
      inputField.value = '';
      this.newValue.emit(undefined);
    }
  }

}
