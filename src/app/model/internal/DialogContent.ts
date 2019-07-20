import {DialogType} from './DialogType';

export class DialogContent {

  private _header: string;
  private _text: string[];
  private _type: DialogType;

  constructor(header: string, text: string[], type: DialogType) {
    this.header = header;
    this.text = text;
    this.type = type;
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

}
