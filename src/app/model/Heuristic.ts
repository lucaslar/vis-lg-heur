import {HeuristicDefiner} from './enums/HeuristicDefiner';
import {DefinableValue} from './internal/value-definition/DefinableValue';
import {MachineConfig} from './enums/MachineConfig';

export class Heuristic {

  private readonly _name: string;
  private readonly _heuristicDefiner: HeuristicDefiner;
  private readonly _requiredValues: DefinableValue[];
  private readonly _requiredMachineConfigs: MachineConfig[];
  // TODO: Required machine nr.
  // TODO: For priority rules only: Add "does rule need due dates"-method

  constructor(name: string,
              heuristicDefiner: HeuristicDefiner,
              requiredValues: DefinableValue[],
              requiredMachineConfigs: MachineConfig[]) {
    this._name = name;
    this._heuristicDefiner = heuristicDefiner;
    this._requiredValues = requiredValues;
    this._requiredMachineConfigs = requiredMachineConfigs;
  }

  static getHeuristicByDefiner(definer: HeuristicDefiner): Heuristic {
    // TODO: Add heuristics
    if (definer === HeuristicDefiner.PRIORITY_RULES) {
      return this.priorityRulesHeuristic(definer);
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

}
