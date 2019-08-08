import {Pipe, PipeTransform} from '@angular/core';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';
import {Job} from '../model/Job';

@Pipe({
  name: 'betaFormal'
})
export class BetaFormalPipe implements PipeTransform {

  transform(value: Job[], objectiveFunction: ObjectiveFunction): string {

    const betaFormal: string[] = [];

    // Add due dates:
    if (objectiveFunction === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
      || objectiveFunction === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES
      || objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || objectiveFunction === ObjectiveFunction.SUM_DELAYED_WORK
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK) {
      betaFormal.push('d<sub>j</sub>');
    }

    // Add weights:
    if (objectiveFunction === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      betaFormal.push('w<sub>j</sub>');
    }

    // Add setup times:
    if (objectiveFunction === ObjectiveFunction.SUM_SETUP_TIME) {
      betaFormal.push('s<sub>jk</sub>');
    }

    return betaFormal.join(', ');
  }
}
