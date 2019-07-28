import {MachineConfig} from '../../enums/MachineConfig';
import {Heuristic} from '../../Heuristic';
import {PriorityRule} from '../../enums/PriorityRule';
import {ChartData, VisualizableData} from './VisualizableData';

// TODO rename attributes and methods in scheduling service
// TODO Specify types

export class SchedulingResult {

  // TODO Make private
  generalData: GeneralSchedulingData;
  solutionQualityData: Kpi[];
  visualizableGeneralData: VisualizableGeneralData;
  visualizableSolutionQualityData: VisualizableSolutionQualityData;

}

export class Kpi {
  // TODO Make private
  title: string;
  kpi: number;
  iconClasses: string[];
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

export class VisualizableSolutionQualityData {

  // TODO Make private
  cumulatedDelaysAtTimestamps: VisualizableData;
  totalPercentageOfDelayedJobs: ChartData;
  percentageOfFinishedJobsAtTimestamp: VisualizableData;
  // TODO No any
  allMachineOperationStartsAtTimestamp: any;

}
