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

  /**
   * List of all objective functions as string array
   */
  private _objectiveFunctionsAsStrings: string[];

  /**
   * The objective function selected by the user
   */
  private _selectedFunction: ObjectiveFunction;

  constructor(public storage: StorageService) {
  }

  /**
   * Initialized {_objectiveFunctionsAsStrings} and {_selectedFunction}.
   */
  ngOnInit(): void {
    this._objectiveFunctionsAsStrings = Object.values(ObjectiveFunction);
    this.selectedFunction = this.storage.objectiveFunction;
  }

  /**
   * Deletes the selected objective function.
   */
  deleteObjectiveFunction() {
    this.selectedFunction = undefined;
    this.storage.objectiveFunction = null;
  }

  /**
   * Changes the objective function based on the user's selection.
   *
   * @param event Selection event
   */
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
