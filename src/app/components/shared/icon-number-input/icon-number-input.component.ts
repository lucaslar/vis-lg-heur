import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

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
  @Input() readonly minErrorText: string;
  @Input() readonly maxErrorText: string;
  @Input() readonly value: number;

  @Output() newValue: EventEmitter<number> = new EventEmitter();

  isLegalValue = true;

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    if (this.iconClasses) {
      this.iconClasses.forEach(
        className => (<HTMLElement>this.icon.nativeElement).classList.add(className)
      );
    }
    this.changeDetector.detectChanges();
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

  get currentTooltip(): string | undefined {
    if (this.inputFieldRef) {

      const value: number = +this.inputFieldRef.nativeElement.value;
      let message = '';

      if (value && this.max && value > this.max && this.maxErrorText) {
        message = this.maxErrorText + ' - ';
      } else if (value && this.min && value < this.min && this.minErrorText) {
        message = this.minErrorText + ' - ';
      }

      if (!value || !this.isLegalValue) {
        if (this.max && this.min) {
          message += 'Bitte geben Sie einen Wert zwischen ' + this.min + ' und ' + this.max + ' ein';
        } else if (this.max) {
          message += 'Bitte geben Sie einen positiven Wert bis ' + this.max + ' ein';
        } else if (this.min) {
          message += 'Bitte geben Sie einen positiven Wert ab ' + this.min + ' ein';
        } else {
          message = 'Bitte geben Sie einen positiven Wert ein';
        }
      }

      return message;
    } else {
      return undefined;
    }
  }

}
