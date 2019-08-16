import {HeuristicDefiner} from '../enums/HeuristicDefiner';
import {DefinableValue} from '../internal/value-definition/DefinableValue';
import {MachineConfig} from '../enums/MachineConfig';
import {ObjectiveFunction} from '../enums/ObjectiveFunction';

export class Heuristic {

  /**
   * Name of the heuristic procedure
   */
  private readonly _name: string;

  /**
   * Internally used definer of the heuristic
   */
  private readonly _heuristicDefiner: HeuristicDefiner;

  /**
   * Values that need to be defined in order to be able to use the heuristic
   */
  private readonly _requiredValues: DefinableValue[];

  /**
   * Required machine config(s) in order to be able to use the heuristic
   */
  private readonly _requiredMachineConfigs: MachineConfig[];

  /**
   * Required values for specific objective functions
   */
  private readonly _requiredValuesForObjectiveFunctions: Map<ObjectiveFunction, DefinableValue[]>;

  /**
   * Machine configs with limited possible objective functions / only possible objective functions for certain machine configs
   */
  private readonly _machineConfigRequiresFunction: Map<MachineConfig, ObjectiveFunction[]>;

  constructor(name: string,
              heuristicDefiner: HeuristicDefiner,
              requiredValues: DefinableValue[],
              requiredMachineConfigs: MachineConfig[],
              requiredValuesForObjectiveFunctions?: Map<ObjectiveFunction, DefinableValue[]>,
              machineConfigRequiresFunction?: Map<MachineConfig, ObjectiveFunction[]>) {
    this._name = name;
    this._heuristicDefiner = heuristicDefiner;
    this._requiredValues = requiredValues;
    this._requiredMachineConfigs = requiredMachineConfigs;
    this._requiredValuesForObjectiveFunctions = requiredValuesForObjectiveFunctions;
    this._machineConfigRequiresFunction = machineConfigRequiresFunction;
  }

  /**
   * @param definer Definer of heuristic to be returned
   * @returns Heuristic determined by internal definer
   */
  static getHeuristicByDefiner(definer: HeuristicDefiner): Heuristic {
    if (definer === HeuristicDefiner.PRIORITY_RULES) {
      return this.priorityRulesHeuristic(definer);
    } else if (definer === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      return this.nearestNeighbourHeuristic(definer);
    } else if (definer === HeuristicDefiner.NEH_HEURISTIC) {
      return this.nehHeuristic(definer);
    } else if (definer === HeuristicDefiner.LOCAL_SEARCH) {
      return this.localSearchHeuristic(definer);
    } else if (definer === HeuristicDefiner.SHIFTING_BOTTLENECK) {
      return this.shiftingBottleneck(definer);
    }
  }

  /**
   * @param definer Definer of the heuristic
   * @returns Concrete heuristic: Priority rules
   */
  private static priorityRulesHeuristic(definer: HeuristicDefiner): Heuristic {
    return new Heuristic(
      'Prioritätsregeln',
      definer,
      [DefinableValue.PRIORITY_RULES, DefinableValue.ALPHA_JOB_TIMES, DefinableValue.BETA_DUE_DATES],
      [MachineConfig.ONE_MACHINE, MachineConfig.FLOWSHOP, MachineConfig.JOBSHOP]
    );
  }

  /**
   * @param definer Definer of the heuristic
   * @returns Concrete heuristic: Nearest-Neighbour-Heuristic
   */
  private static nearestNeighbourHeuristic(definer: HeuristicDefiner) {
    const functions = new Map<ObjectiveFunction, DefinableValue[]>();
    functions.set(ObjectiveFunction.SUM_SETUP_TIME, []);

    return new Heuristic(
      'Nächster Nachbar',
      definer,
      [DefinableValue.ALPHA_JOB_TIMES, DefinableValue.BETA_SETUP_TIMES],
      [MachineConfig.ONE_MACHINE],
      functions
    );
  }

  /**
   * @param definer Definer of the heuristic
   * @returns Concrete heuristic: NEH-Heuristic
   */
  private static nehHeuristic(definer: HeuristicDefiner) {
    const functions = new Map<ObjectiveFunction, DefinableValue[]>();
    functions.set(ObjectiveFunction.CYCLE_TIME, []);
    functions.set(ObjectiveFunction.SUM_FINISHING_TIMESTAMPS, []);
    functions.set(ObjectiveFunction.MAX_DELAY, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS, [DefinableValue.BETA_WEIGHTS]);
    functions.set(ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_DELAYED_WORK, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES, DefinableValue.BETA_WEIGHTS]);
    functions.set(ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_WEIGHTS, DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK, [DefinableValue.BETA_DUE_DATES, DefinableValue.BETA_WEIGHTS]);

    const machineConfigRequiresFunction = new Map<MachineConfig, ObjectiveFunction[]>();
    machineConfigRequiresFunction.set(MachineConfig.ONE_MACHINE, [
      ObjectiveFunction.MAX_DELAY,
      ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS,
      ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.SUM_DELAYED_WORK,
      ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
    ]);

    return new Heuristic(
      'NEH-Heuristik',
      definer,
      [DefinableValue.ALPHA_JOB_TIMES],
      [MachineConfig.ONE_MACHINE, MachineConfig.FLOWSHOP],
      functions,
      machineConfigRequiresFunction
    );
  }

  /**
   * @param definer Definer of the heuristic
   * @returns Concrete heuristic: Local Search
   */
  private static localSearchHeuristic(definer: HeuristicDefiner): Heuristic {
    const functions = new Map<ObjectiveFunction, DefinableValue[]>();
    functions.set(ObjectiveFunction.CYCLE_TIME, []);
    functions.set(ObjectiveFunction.SUM_FINISHING_TIMESTAMPS, []);
    functions.set(ObjectiveFunction.MAX_DELAY, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS, [DefinableValue.BETA_WEIGHTS]);
    functions.set(ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_DELAYED_WORK, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES, DefinableValue.BETA_WEIGHTS]);
    functions.set(ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_WEIGHTS, DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK, [DefinableValue.BETA_DUE_DATES, DefinableValue.BETA_WEIGHTS]);

    const machineConfigRequiresFunction = new Map<MachineConfig, ObjectiveFunction[]>();
    machineConfigRequiresFunction.set(MachineConfig.ONE_MACHINE, [
      ObjectiveFunction.MAX_DELAY,
      ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS,
      ObjectiveFunction.SUM_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.NUMBER_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.SUM_DELAYED_WORK,
      ObjectiveFunction.SUM_WEIGHTED_DELAYED_WORK
    ]);

    return new Heuristic(
      'Lokale Suche',
      definer,
      [DefinableValue.ALPHA_JOB_TIMES],
      [MachineConfig.ONE_MACHINE, MachineConfig.FLOWSHOP],
      functions,
      machineConfigRequiresFunction
    );
  }

  /**
   * @param definer Definer of the heuristic
   * @returns Concrete heuristic: Shifting-Bottleneck-Heuristic
   */
  private static shiftingBottleneck(definer: HeuristicDefiner): Heuristic {
    const functions = new Map<ObjectiveFunction, DefinableValue[]>();
    functions.set(ObjectiveFunction.CYCLE_TIME, []);

    return new Heuristic(
      'Shifting-Bottleneck-Heuristik (auf Basis von Branch and Bound)',
      definer,
      [DefinableValue.ALPHA_JOB_TIMES],
      [MachineConfig.JOBSHOP],
      functions
    );
  }

  get name(): string {
    return this._name;
  }

  get heuristicDefiner(): HeuristicDefiner {
    return this._heuristicDefiner;
  }

  get requiredMachineConfigs(): MachineConfig[] {
    return this._requiredMachineConfigs;
  }

  get requiredValues(): DefinableValue[] {
    return this._requiredValues;
  }

  get requiredValuesForObjectiveFunctions(): Map<ObjectiveFunction, DefinableValue[]> {
    return this._requiredValuesForObjectiveFunctions;
  }

  get machineConfigRequiresFunction(): Map<MachineConfig, ObjectiveFunction[]> {
    return this._machineConfigRequiresFunction;
  }
}
