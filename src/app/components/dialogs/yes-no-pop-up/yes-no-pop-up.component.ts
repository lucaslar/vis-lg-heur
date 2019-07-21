import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {DialogContent} from '../../../model/internal/DialogContent';
import {DialogType} from '../../../model/internal/DialogType';

@Component({
  selector: 'app-yes-no-pop-up',
  templateUrl: './yes-no-pop-up.component.html',
  styleUrls: ['./yes-no-pop-up.component.css', '../shared-dialog-styles.css']
})
export class YesNoPopUpComponent {

  private readonly _type = DialogType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogContent
  ) {
  }

  get type(): any {
    return this._type;
  }

}
