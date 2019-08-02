import {Pipe, PipeTransform} from '@angular/core';
import {ObjectiveFunction} from '../model/enums/ObjectiveFunction';
import {Job} from '../model/Job';

@Pipe({
  name: 'betaFormal'
})
export class BetaFormalPipe implements PipeTransform {

  private static formalDueDates(jobs: Job[]): string {
    return jobs.map(job => 'd<sub>' + job.id + '</sub>=' + job.dueDate).join(', ');
  }

  private static formalWeightings(jobs: Job[]): string {
    return jobs.map(job => 'w<sub>' + job.id + '</sub>' + job.weight).join(', ');
  }

  private static formalSetupTimes(jobs: Job[]): string {
    return jobs.map(job => {
      const base = 's<sub>' + job.id + ',';
      return job.setupTimesToOtherJobs
        .map(_job => base + _job.idTo + '</sub>=' + _job.duration)
        .join(', ');
    }).join(', ');
  }

  transform(value: Job[], objectiveFunction: ObjectiveFunction): string {

    let betaFormal = '';
    value = value.sort((j1, j2) => j1.id - j2.id);

    // Add due dates:
    if (objectiveFunction === ObjectiveFunction.MEAN_DELAY
      || objectiveFunction === ObjectiveFunction.NUMBER_OF_DELAYS
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYS) {
      betaFormal += BetaFormalPipe.formalDueDates(value);
    }

    // Add weights:
    if (objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_DELAYS
      || objectiveFunction === ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS) {
      if (betaFormal) {
        betaFormal += ', ';
      }
      betaFormal += BetaFormalPipe.formalWeightings(value);
    }

    // Add setup times:
    if (objectiveFunction === ObjectiveFunction.SUM_SETUP_TIME) {
      if (betaFormal) {
        betaFormal += ', ';
      }
      betaFormal += BetaFormalPipe.formalSetupTimes(value);
    }

    return betaFormal;
  }
}
