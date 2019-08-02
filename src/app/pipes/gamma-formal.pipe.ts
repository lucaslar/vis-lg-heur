import {Pipe, PipeTransform} from '@angular/core';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';

@Pipe({
  name: 'objectiveFunctionFormal'
})
export class GammaFormalPipe implements PipeTransform {

  transform(value: ObjectiveFunction): string {
    if (value === ObjectiveFunction.CYCLE_TIME) {
      return 'C<sub>max</sub>';
    } else if (value === ObjectiveFunction.MEAN_DELAY) {
      return 'undefined';
    } else if (value === ObjectiveFunction.SUM_FINISHING_TIMESTAMPS) {
      return '&sum;C<sub>j</sub>';
    } else if (value === ObjectiveFunction.NUMBER_OF_DEADLINE_EXCEEDANCES) {
      return '&sum;U<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      return '&sum;w<sub>j</sub>C<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      return '&sum;w<sub>j</sub>U<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_SETUP_TIME) {
      // TODO Correct?
      return '&sum; s<sub>j</sub>';
    } else {
      // TODO: delete after having defined each
      console.error('define: ' + value);
    }
  }

}
