import {HeuristicDefiner} from './enums/HeuristicDefiner';
import {DefinableValue} from './internal/value-definition/DefinableValue';
import {MachineConfig} from './enums/MachineConfig';
import {ObjectiveFunction} from './enums/ObjectiveFunction';

export class Heuristic {

  private readonly _name: string;
  private readonly _heuristicDefiner: HeuristicDefiner;
  private readonly _requiredValues: DefinableValue[];
  private readonly _requiredMachineConfigs: MachineConfig[];
  private readonly _requiredValuesForObjectiveFunctions: Map<ObjectiveFunction, DefinableValue[]>;
  private readonly _machineConfigRequiresFunction: Map<MachineConfig, ObjectiveFunction[]>;

  // TODO: Add complexity?

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

  static getHeuristicByDefiner(definer: HeuristicDefiner): Heuristic {
    if (definer === HeuristicDefiner.PRIORITY_RULES) {
      return this.priorityRulesHeuristic(definer);
    } else if (definer === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      return this.nearestNeighbourHeuristic(definer);
    } else if (definer === HeuristicDefiner.NEH_HEURISTIC) {
      return this.nehHeuristic(definer);
    } else if (definer === HeuristicDefiner.LOCAL_SEARCH) {
      return this.localSearchHeuristic(definer);
    } else {
      // TODO: Delete when not needed any longer
      console.error('define ' + definer);
      return undefined;
    }
  }

  private static priorityRulesHeuristic(definer: HeuristicDefiner): Heuristic {
    return new Heuristic(
      'Prioritätsregeln',
      definer,
      [DefinableValue.PRIORITY_RULES, DefinableValue.ALPHA_JOB_TIMES, DefinableValue.BETA_DUE_DATES],
      [MachineConfig.ONE_MACHINE, MachineConfig.FLOWSHOP, MachineConfig.JOBSHOP]
    );
  }

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

  private static nehHeuristic(definer: HeuristicDefiner) {
    const functions = new Map<ObjectiveFunction, DefinableValue[]>();
    functions.set(ObjectiveFunction.CYCLE_TIME, []);
    functions.set(ObjectiveFunction.SUM_FINISHING_TIMESTAMPS, []);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS, [DefinableValue.BETA_WEIGHTS]);
    functions.set(ObjectiveFunction.MEAN_DELAY, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.NUMBER_OF_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_WEIGHTS, DefinableValue.BETA_DUE_DATES]);

    const machineConfigRequiresFunction = new Map<MachineConfig, ObjectiveFunction[]>();
    machineConfigRequiresFunction.set(MachineConfig.ONE_MACHINE, [
      ObjectiveFunction.MEAN_DELAY,
      ObjectiveFunction.NUMBER_OF_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
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

  private static localSearchHeuristic(definer: HeuristicDefiner): Heuristic {
    const functions = new Map<ObjectiveFunction, DefinableValue[]>();
    functions.set(ObjectiveFunction.CYCLE_TIME, []);
    functions.set(ObjectiveFunction.SUM_FINISHING_TIMESTAMPS, []);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_FINISHING_TIMESTAMPS, [DefinableValue.BETA_WEIGHTS]);
    functions.set(ObjectiveFunction.MEAN_DELAY, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.NUMBER_OF_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_DUE_DATES]);
    functions.set(ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES, [DefinableValue.BETA_WEIGHTS, DefinableValue.BETA_DUE_DATES]);

    const machineConfigRequiresFunction = new Map<MachineConfig, ObjectiveFunction[]>();
    machineConfigRequiresFunction.set(MachineConfig.ONE_MACHINE, [
      ObjectiveFunction.MEAN_DELAY,
      ObjectiveFunction.NUMBER_OF_DEADLINE_EXCEEDANCES,
      ObjectiveFunction.SUM_WEIGHTED_DEADLINE_EXCEEDANCES
    ]);

    return new Heuristic(
      'Lokale Suche',
      definer,
      [DefinableValue.ALPHA_JOB_TIMES],
      [MachineConfig.ONE_MACHINE, MachineConfig.FLOWSHOP],
      // TODO: Jobshop?
      functions,
      machineConfigRequiresFunction
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
