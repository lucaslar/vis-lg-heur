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

  isLegalValue = true;

  ngOnInit(): void {
    if (this.iconClasses) {
      this.iconClasses.forEach(
        className => (<HTMLElement>this.icon.nativeElement).classList.add(className)
      );
    }
  }

  checkValidityOfNumber(): void {
    const value: number = +this.inputFieldRef.nativeElement.value;
    this.isLegalValue = !value || !(this.min && value < this.min) && !(this.max && value > this.max);
  }

  onNumberChange(): void {
    const inputField: HTMLInputElement = this.inputFieldRef.nativeElement;
    const value = +inputField.value;
    if (!value) {
      inputField.value = '';
      this.newValue.emit(undefined);
    } else if (this.isLegalValue) {
      inputField.value = (value).toString();
      this.newValue.emit(value);
    }
  }

}
