import {MachineConfig} from '../enums/MachineConfig';
import {Heuristic} from '../Heuristic';
import {PriorityRule} from '../enums/PriorityRule';
import {VisualizableData} from './VisualizableData';

// TODO rename attributes and methods in scheduling service
// TODO Specify types

export class SchedulingResult {

  // TODO Make private
  generalData: GeneralSchedulingData;
  solutionQualityData: SolutionQualityData;
  vizualizableGeneralData: VisualizableGeneralData;
  visualizableSolutionQualityData: VisualizableSolutionQualityData;

}

export class GeneralSchedulingData {

  // TODO Make private
  usedHeuristic: Heuristic;
  priorityRules: PriorityRule[];
  machineConfig: MachineConfig;
  numberOfMachines: number;
  numberOfJobs: number;
  durationInMillis: number;

}

export class VisualizableGeneralData {

  // TODO Make private
  totalDurationOnMachines: VisualizableData;
  totalJobTimes: VisualizableData;

}

export class SolutionQualityData {

  // TODO Make private
  totalDuration: number;
  meanCycleTime: number;
  meanJobBacklog: number;
  maximumDelay: number;
  meanDelay: number;
  standardDeviationOfDelay: number;
  sumOfDelays: number;

}

export class VisualizableSolutionQualityData {

  // TODO Make private
  cumulatedDelaysAtTimestamps: VisualizableData;
  totalPercentageOfDelayedJobs: number;
  percentageOfFinishedJobsAtTimestamp: VisualizableData;
  // TODO No any
  allMachineOperationStartsAtTimestamp: any;

}
