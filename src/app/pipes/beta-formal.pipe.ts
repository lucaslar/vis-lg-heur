import {Pipe, PipeTransform} from '@angular/core';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';
import {Job} from '../model/scheduling/Job';

@Pipe({
  name: 'betaFormal'
})
export class BetaFormalPipe implements PipeTransform {

  transform(value: ObjectiveFunction): string {

    const betaFormal: string[] = [];

    // Add due dates:
    if (value === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES
      || value === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
      || value === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES
      || value === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || value === ObjectiveFunction.SUM_DELAYED_WORK
      || value === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
      || value === ObjectiveFunction.MAX_DELAY) {
      betaFormal.push('d<sub>j</sub>');
    }

    // Add weights:
    if (value === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES
      || value === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS
      || value === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
      || value === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      betaFormal.push('w<sub>j</sub>');
    }

    // Add setup times:
    if (value === ObjectiveFunction.SUM_SETUP_TIME) {
      betaFormal.push('s<sub>jk</sub>');
    }

    return betaFormal.join(', ');
  }
}
