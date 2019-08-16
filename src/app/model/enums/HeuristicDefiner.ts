/**
 * List of all internally used definers for heuristics.
 * (also part of paths: visualize/[definer])
 */
export enum HeuristicDefiner {
  PRIORITY_RULES = 'priority-rules',
  NEAREST_NEIGHBOUR = 'nearest-neighbour',
  NEH_HEURISTIC = 'neh-heuristic',
  LOCAL_SEARCH = 'local-search',
  SHIFTING_BOTTLENECK = 'shifting-bottleneck'
}
