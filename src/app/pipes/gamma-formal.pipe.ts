import {Pipe, PipeTransform} from '@angular/core';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';

@Pipe({
  name: 'objectiveFunctionFormal'
})
export class GammaFormalPipe implements PipeTransform {

  transform(value: ObjectiveFunction): string {
    if (value === ObjectiveFunction.CYCLE_TIME) {
      return 'C<sub>max</sub>';
    } else if (value === ObjectiveFunction.MAX_DELAY) {
      return 'L<sub>max</sub>';
    } else if (value === ObjectiveFunction.SUM_FINISHING_TIMESTAMPS) {
      return '&sum;C<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      return '&sum;w<sub>j</sub>C<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES) {
      return '&sum;T<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES) {
      return '&sum;w<sub>j</sub>T<sub>j</sub>';
    } else if (value === ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES) {
      return '&sum;U<sub>j</sub>';
    } else if (value === ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES) {
      return '&sum;w<sub>j</sub>U<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_DELAYED_WORK) {
      return '&sum;Y<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK) {
      return '&sum;w<sub>j</sub>Y<sub>j</sub>';
    } else if (value === ObjectiveFunction.SUM_SETUP_TIME) {
      return '&sum; s<sub>j</sub>';
    }
  }

}
