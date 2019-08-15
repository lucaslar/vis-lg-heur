import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';

@Component({
  selector: 'app-icon-number-input',
  templateUrl: './icon-number-input.component.html',
  styleUrls: ['./icon-number-input.component.css']
})
export class IconNumberInputComponent implements OnInit {

  /**
   * Reference to the input field itself
   */
  @ViewChild('inputField', {static: false}) inputFieldRef: ElementRef;

  /**
   * Reference to the icon displayed next to the input field
   */
  @ViewChild('icon', {static: true}) icon: ElementRef;

  /**
   * CSS-classes (Font Awesome) representing the icon to be shown
   */
  @Input() readonly iconClasses: string[];

  /**
   * Value shown in the input field
   */
  @Input() readonly value: number;

  /**
   * Lowest possible number
   */
  @Input() readonly min: number;

  /**
   * Highest possible number
   */
  @Input() readonly max: number;

  /**
   * if true, tooltips are shown when hovering a value
   */
  @Input() readonly isShowValueTooltip: string;

  /**
   * Error text for lower entered values than possible
   */
  @Input() readonly minErrorText: string;

  /**
   * Error text for higher entered values than possible
   */
  @Input() readonly maxErrorText: string;

  /**
   * Placeholder to be shown in case of no value
   */
  @Input() readonly placeholder: string;


  /**
   * Emitter for new entered values
   */
  @Output() newValue: EventEmitter<number> = new EventEmitter();


  /**
   * Represents whether the entered value is legal or not
   */
  isLegalValue = true;

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  /**
   * Loads the icon to be shown using the given classes on initializing this component.
   */
  ngOnInit(): void {
    if (this.iconClasses) {
      this.iconClasses.forEach(
        className => (<HTMLElement>this.icon.nativeElement).classList.add(className)
      );
    }
    this.changeDetector.detectChanges();
  }

  /**
   * Checks the validity of a number and sets {isLegalValue} accordingly
   */
  checkValidityOfNumber(): void {
    const value: number = +this.inputFieldRef.nativeElement.value;
    this.isLegalValue = !value || !(this.min && value < this.min) && !(this.max && value > this.max);
  }

  /**
   * Eliminates leading zeros and, if the value is legal, emits the new number.
   */
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

  /**
   * @returns undefined or current tooltip (error message or value if showing tooltips these is defined)
   */
  get currentTooltip(): string | undefined {
    if (this.inputFieldRef) {

      const value: number = +this.inputFieldRef.nativeElement.value;
      let message = '';

      if (!this.isLegalValue) {
        message = 'Dieser Wert wird nicht gespeichert! ';
      }

      if (value && this.max && value > this.max && this.maxErrorText) {
        message += this.maxErrorText + ' - ';
      } else if (value && this.min && value < this.min && this.minErrorText) {
        message += this.minErrorText + ' - ';
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
      } else if (this.isShowValueTooltip) {
        message += this.placeholder ? (this.placeholder + ': ' + value) : value;
      }

      return message;
    } else {
      return undefined;
    }
  }

}
