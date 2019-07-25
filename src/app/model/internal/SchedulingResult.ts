import {MachineConfig} from '../enums/MachineConfig';
import {Heuristic} from '../Heuristic';
import {PriorityRule} from '../enums/PriorityRule';
import {ScheduledJob} from '../ScheduledJob';
import {Machine} from '../Machine';
import {VisualizableData} from './VisualizableData';

export class SchedulingResult {

  private _generalData: GeneralSchedulingData;
  private _solutionQualityData: SolutionQualityData;
  private _vizualizableGeneralData: VisualizableGeneralData;
  private _visualizableSolutionQualityData: VisualizableSolutionQualityData;

  get generalData(): GeneralSchedulingData {
    return this._generalData;
  }

  set generalData(value: GeneralSchedulingData) {
    this._generalData = value;
  }

  get solutionQualityData(): SolutionQualityData {
    return this._solutionQualityData;
  }

  set solutionQualityData(value: SolutionQualityData) {
    this._solutionQualityData = value;
  }

  get vizualizableGeneralData(): VisualizableGeneralData {
    return this._vizualizableGeneralData;
  }

  set vizualizableGeneralData(value: VisualizableGeneralData) {
    this._vizualizableGeneralData = value;
  }

  get visualizableSolutionQualityData(): VisualizableSolutionQualityData {
    return this._visualizableSolutionQualityData;
  }

  set visualizableSolutionQualityData(value: VisualizableSolutionQualityData) {
    this._visualizableSolutionQualityData = value;
  }
}

export class GeneralSchedulingData {

  private _usedHeuristic: Heuristic;
  private _priorityRules: PriorityRule[];
  private _machineConfig: MachineConfig;
  private _numberOfMachines: number;
  private _numberOfJobs: number;

  get usedHeuristic(): Heuristic {
    return this._usedHeuristic;
  }

  set usedHeuristic(value: Heuristic) {
    this._usedHeuristic = value;
  }

  get priorityRules(): PriorityRule[] {
    return this._priorityRules;
  }

  set priorityRules(value: PriorityRule[]) {
    this._priorityRules = value;
  }

  get machineConfig(): MachineConfig {
    return this._machineConfig;
  }

  set machineConfig(value: MachineConfig) {
    this._machineConfig = value;
  }

  get numberOfMachines(): number {
    return this._numberOfMachines;
  }

  set numberOfMachines(value: number) {
    this._numberOfMachines = value;
  }

  get numberOfJobs(): number {
    return this._numberOfJobs;
  }

  set numberOfJobs(value: number) {
    this._numberOfJobs = value;
  }
}

export class VisualizableGeneralData {

  private _totalDurationOnMachines: VisualizableData;
  private _totalJobTimes: VisualizableData;

  get totalDurationOnMachines(): VisualizableData {
    return this._totalDurationOnMachines;
  }

  set totalDurationOnMachines(value: VisualizableData) {
    this._totalDurationOnMachines = value;
  }

  get totalJobTimes(): VisualizableData {
    return this._totalJobTimes;
  }

  set totalJobTimes(value: VisualizableData) {
    this._totalJobTimes = value;
  }
}

export class SolutionQualityData {

  private _totalDuration: number;
  private _meanCycleTime: number;
  private _meanJobBacklog: number;
  private _maximumDelay: number;
  private _meanDelay: number;
  private _standardDeviationOfDelay: number;
  private _sumOfDelays: number;

  get totalDuration(): number {
    return this._totalDuration;
  }

  set totalDuration(value: number) {
    this._totalDuration = value;
  }

  get meanCycleTime(): number {
    return this._meanCycleTime;
  }

  set meanCycleTime(value: number) {
    this._meanCycleTime = value;
  }

  get meanJobBacklog(): number {
    return this._meanJobBacklog;
  }

  set meanJobBacklog(value: number) {
    this._meanJobBacklog = value;
  }

  get maximumDelay(): number {
    return this._maximumDelay;
  }

  set maximumDelay(value: number) {
    this._maximumDelay = value;
  }

  get meanDelay(): number {
    return this._meanDelay;
  }

  set meanDelay(value: number) {
    this._meanDelay = value;
  }

  get standardDeviationOfDelay(): number {
    return this._standardDeviationOfDelay;
  }

  set standardDeviationOfDelay(value: number) {
    this._standardDeviationOfDelay = value;
  }

  get sumOfDelays(): number {
    return this._sumOfDelays;
  }

  set sumOfDelays(value: number) {
    this._sumOfDelays = value;
  }
}

export class VisualizableSolutionQualityData {

  private _cumulatedDelaysAtTimestamps: VisualizableData;
  private _totalPercentageOfDelayedJobs: number;
  private _percentageOfFinishedJobsAtTimestamp: VisualizableData;
  // TODO: Timestamp -> (machine -> Job) or better machine -> (ts -> Job) / Find type
  private _allMachineOperationStartsAtTimestamp: Map<Machine, Map<number, ScheduledJob>>;

  get cumulatedDelaysAtTimestamps(): VisualizableData {
    return this._cumulatedDelaysAtTimestamps;
  }

  set cumulatedDelaysAtTimestamps(value: VisualizableData) {
    this._cumulatedDelaysAtTimestamps = value;
  }

  get totalPercentageOfDelayedJobs(): number {
    return this._totalPercentageOfDelayedJobs;
  }

  set totalPercentageOfDelayedJobs(value: number) {
    this._totalPercentageOfDelayedJobs = value;
  }

  get percentageOfFinishedJobsAtTimestamp(): VisualizableData {
    return this._percentageOfFinishedJobsAtTimestamp;
  }

  set percentageOfFinishedJobsAtTimestamp(value: VisualizableData) {
    this._percentageOfFinishedJobsAtTimestamp = value;
  }

  get allMachineOperationStartsAtTimestamp(): Map<Machine, Map<number, ScheduledJob>> {
    return this._allMachineOperationStartsAtTimestamp;
  }

  set allMachineOperationStartsAtTimestamp(value: Map<Machine, Map<number, ScheduledJob>>) {
    this._allMachineOperationStartsAtTimestamp = value;
  }
}
