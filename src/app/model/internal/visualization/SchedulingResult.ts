import {MachineConfig} from '../../enums/MachineConfig';
import {Heuristic} from '../../Heuristic';
import {PriorityRule} from '../../enums/PriorityRule';
import {ChartData, TimelineData} from './VisualizableData';
import {LogEventType} from '../../enums/LogEventType';

export class SchedulingResult {

  private _generalData: GeneralSchedulingData;
  private _solutionQualityData: Kpi[];
  private _visualizableGeneralData: VisualizableGeneralData;
  private _visualizableSolutionQualityData: VisualizableSolutionQualityData;
  private _schedulingTimesData: SchedulingTimesData;
  private _schedulingLogging: SchedulingLogEntry[];

  get generalData(): GeneralSchedulingData {
    return this._generalData;
  }

  set generalData(value: GeneralSchedulingData) {
    this._generalData = value;
  }

  get solutionQualityData(): Kpi[] {
    return this._solutionQualityData;
  }

  set solutionQualityData(value: Kpi[]) {
    this._solutionQualityData = value;
  }

  get visualizableGeneralData(): VisualizableGeneralData {
    return this._visualizableGeneralData;
  }

  set visualizableGeneralData(value: VisualizableGeneralData) {
    this._visualizableGeneralData = value;
  }

  get visualizableSolutionQualityData(): VisualizableSolutionQualityData {
    return this._visualizableSolutionQualityData;
  }

  set visualizableSolutionQualityData(value: VisualizableSolutionQualityData) {
    this._visualizableSolutionQualityData = value;
  }

  get schedulingTimesData(): SchedulingTimesData {
    return this._schedulingTimesData;
  }

  set schedulingTimesData(value: SchedulingTimesData) {
    this._schedulingTimesData = value;
  }

  get schedulingLogging(): SchedulingLogEntry[] {
    return this._schedulingLogging;
  }

  set schedulingLogging(value: SchedulingLogEntry[]) {
    this._schedulingLogging = value;
  }
}

export class GeneralSchedulingData {

  // TODO Add complexity here? (and set in scheduling service)
  private _usedHeuristic: Heuristic;
  private _priorityRules: PriorityRule[];
  private _machineConfig: MachineConfig;
  private _numberOfMachines: number;
  private _numberOfJobs: number;
  private _durationInMillisKpi: Kpi;

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

  get durationInMillisKpi(): Kpi {
    return this._durationInMillisKpi;
  }

  set durationInMillisKpi(value: Kpi) {
    this._durationInMillisKpi = value;
  }
}

export class Kpi {

  private _title: string;
  private _kpi: number;
  private _iconClasses: string[];

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }

  get kpi(): number {
    return this._kpi;
  }

  set kpi(value: number) {
    this._kpi = value;
  }

  get iconClasses(): string[] {
    return this._iconClasses;
  }

  set iconClasses(value: string[]) {
    this._iconClasses = value;
  }
}

export class VisualizableGeneralData {

  private _totalDurationsOnMachines: ChartData;
  private _totalJobTimes: ChartData;

  get totalDurationsOnMachines(): ChartData {
    return this._totalDurationsOnMachines;
  }

  set totalDurationsOnMachines(value: ChartData) {
    this._totalDurationsOnMachines = value;
  }

  get totalJobTimes(): ChartData {
    return this._totalJobTimes;
  }

  set totalJobTimes(value: ChartData) {
    this._totalJobTimes = value;
  }
}

export class VisualizableSolutionQualityData {

  private _cumulatedDelaysAtTimestamps: ChartData;
  private _comparisonDelayedAndInTimeJobs: ChartData;
  private _finishedJobsAtTimestamp: ChartData;

  get cumulatedDelaysAtTimestamps(): ChartData {
    return this._cumulatedDelaysAtTimestamps;
  }

  set cumulatedDelaysAtTimestamps(value: ChartData) {
    this._cumulatedDelaysAtTimestamps = value;
  }

  get comparisonDelayedAndInTimeJobs(): ChartData {
    return this._comparisonDelayedAndInTimeJobs;
  }

  set comparisonDelayedAndInTimeJobs(value: ChartData) {
    this._comparisonDelayedAndInTimeJobs = value;
  }

  get finishedJobsAtTimestamp(): ChartData {
    return this._finishedJobsAtTimestamp;
  }

  set finishedJobsAtTimestamp(value: ChartData) {
    this._finishedJobsAtTimestamp = value;
  }

}

export class SchedulingTimesData {
  private _allMachineOperationsTimeline: TimelineData;
  private _machineTables: MachineTableData[];

  get allMachineOperationsTimeline(): TimelineData {
    return this._allMachineOperationsTimeline;
  }

  set allMachineOperationsTimeline(value: TimelineData) {
    this._allMachineOperationsTimeline = value;
  }

  get machineTables(): MachineTableData[] {
    return this._machineTables;
  }

  set machineTables(value: MachineTableData[]) {
    this._machineTables = value;
  }
}

export class MachineTableData {
  private _machineNr: number;
  private _machineTableEntries: MachineTableEntry[];

  get machineNr(): number {
    return this._machineNr;
  }

  set machineNr(value: number) {
    this._machineNr = value;
  }

  get machineTableEntries(): MachineTableEntry[] {
    return this._machineTableEntries;
  }

  set machineTableEntries(value: MachineTableEntry[]) {
    this._machineTableEntries = value;
  }
}

export class MachineTableEntry {
  private _timestampStart: number;
  private _timestampEnd: number;
  private _producedJobString: string;
  private _color: string;

  get timestampStart(): number {
    return this._timestampStart;
  }

  set timestampStart(value: number) {
    this._timestampStart = value;
  }

  get timestampEnd(): number {
    return this._timestampEnd;
  }

  set timestampEnd(value: number) {
    this._timestampEnd = value;
  }

  get producedJobString(): string {
    return this._producedJobString;
  }

  set producedJobString(value: string) {
    this._producedJobString = value;
  }

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    this._color = value;
  }
}

export class SchedulingLogEntry {

  private readonly _timestamp: number;
  private readonly _machineNr: number;
  private readonly _description: string;
  private readonly _eventType: LogEventType;

  constructor(timestamp: number, machineNr: number, description: string, eventType: LogEventType) {
    this._timestamp = timestamp;
    this._machineNr = machineNr;
    this._description = description;
    this._eventType = eventType;
  }

  get timestamp(): number {
    return this._timestamp;
  }

  get machineNr(): number {
    return this._machineNr;
  }

  get description(): string {
    return this._description;
  }

  get eventType(): LogEventType {
    return this._eventType;
  }
}
