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

  // TODO: Required machine nr.?

  constructor(name: string,
              heuristicDefiner: HeuristicDefiner,
              requiredValues: DefinableValue[],
              requiredMachineConfigs: MachineConfig[],
              requiredValuesForObjectiveFunctions?: Map<ObjectiveFunction, DefinableValue[]>) {
    this._name = name;
    this._heuristicDefiner = heuristicDefiner;
    this._requiredValues = requiredValues;
    this._requiredMachineConfigs = requiredMachineConfigs;
    this._requiredValuesForObjectiveFunctions = requiredValuesForObjectiveFunctions;
  }

  static getHeuristicByDefiner(definer: HeuristicDefiner): Heuristic {
    // TODO: Add heuristics
    if (definer === HeuristicDefiner.PRIORITY_RULES) {
      return this.priorityRulesHeuristic(definer);
    } else if (definer === HeuristicDefiner.NEAREST_NEIGHBOUR) {
      return this.nearestNeighbourHeuristic(definer);
    } else {
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
}
