import {Component, Inject} from '@angular/core';
import {DialogType} from '../../../model/internal/DialogType';
import {MAT_DIALOG_DATA} from '@angular/material';
import {DialogContent} from '../../../model/internal/DialogContent';

@Component({
  selector: 'app-pop-up',
  templateUrl: './pop-up.component.html',
  styleUrls: ['./pop-up.component.css', '../shared-dialog-styles.css']
})
export class PopUpComponent {

  private readonly _type = DialogType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogContent
  ) {
  }

  get type(): any {
    return this._type;
  }

}
