import {Component, OnInit} from '@angular/core';
import {ObjectiveFunction} from '../../../../model/enums/ObjectiveFunction';
import {MatRadioChange} from '@angular/material';
import {StorageService} from '../../../../services/storage.service';

@Component({
  selector: 'app-objective-function-definition',
  templateUrl: './objective-function-definition.component.html',
  styleUrls: ['./objective-function-definition.component.css', '../../pages-styles.css']
})
export class ObjectiveFunctionDefinitionComponent implements OnInit {

  private _objectiveFunctionsAsStrings: string[];
  private _selectedFunction: ObjectiveFunction;

  constructor(public storage: StorageService) {
  }

  ngOnInit(): void {
    this._objectiveFunctionsAsStrings = Object.values(ObjectiveFunction);
    this.selectedFunction = this.storage.objectiveFunction;
  }

  deleteObjectiveFunction() {
    this.selectedFunction = undefined;
    this.storage.objectiveFunction = null;
  }

  onSelectionChange(event: MatRadioChange): void {
    this.storage.objectiveFunction = event.value;
  }

  get objectiveFunctionsAsStrings(): string[] {
    return this._objectiveFunctionsAsStrings;
  }

  get selectedFunction(): ObjectiveFunction {
    return this._selectedFunction;
  }

  set selectedFunction(value: ObjectiveFunction) {
    this._selectedFunction = value;
  }
}
