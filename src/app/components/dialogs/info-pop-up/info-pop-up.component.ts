import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material';
import {DialogContent} from '../../../model/internal/DialogContent';
import {DialogType} from '../../../model/internal/DialogType';

@Component({
  selector: 'app-info-pop-up',
  templateUrl: './info-pop-up.component.html',
  styleUrls: ['./info-pop-up.component.css', '/../shared-dialog-styles.css']
})
export class InfoPopUpComponent {

  private readonly _type = DialogType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogContent
  ) {
  }

  get type(): any {
    return this._type;
  }

}
