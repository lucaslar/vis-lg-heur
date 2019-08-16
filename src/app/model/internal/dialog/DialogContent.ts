import {DialogType} from './DialogType';

/**
 * Content to be shown in a basic dialog (unified component).
 */
export class DialogContent {

  /**
   * Header of the dialog
   */
  private _header: string;

  /**
   * Text to be shown, each string is a paragraph
   */
  private _text: string[];

  /**
   * Type of the dialog which also defines the color and the buttons (alert/confirm) of the component
   */
  private _type: DialogType;

  /**
   * Additional (optional) elements to be listed
   */
  private _listedElements: string[];

  constructor(header: string, text: string[], type: DialogType, listedElements?: string[]) {
    this.header = header;
    this.text = text;
    this.type = type;
    this.listedElements = listedElements;
  }

  get header(): string {
    return this._header;
  }

  set header(header: string) {
    this._header = header;
  }

  get text(): string[] {
    return this._text;
  }

  set text(text: string[]) {
    this._text = text;
  }

  get type(): DialogType {
    return this._type;
  }

  set type(type: DialogType) {
    this._type = type;
  }

  get listedElements(): string[] {
    return this._listedElements;
  }

  set listedElements(listedElements: string[]) {
    this._listedElements = listedElements;
  }

}
