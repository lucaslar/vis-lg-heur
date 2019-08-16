/**
 * List of all selectable objective functions.
 */
export enum ObjectiveFunction {
  CYCLE_TIME = 'Gesamtdauer',
  MAX_DELAY = 'Maximale Verspätung',
  SUM_FINISHING_TIMESTAMPS = 'Summe der Fertigstellungszeitpunkte',
  SUM_WEIGHTED_FINISHING_TIMESTAMPS = 'Summe der gewichteten Fertigstellungszeitpunkte',
  SUM_DEADLINE_EXCEEDANCES = 'Summe der Terminüberschreitungen',
  SUM_WEIGHTED_DEADLINE_EXCEEDANCES = 'Summe der gewichteten Terminüberschreitungen',
  NUMBER_DEADLINE_EXCEEDANCES = 'Anzahl der Terminüberschreitungen',
  WEIGHTED_NUMBER_DEADLINE_EXCEEDANCES = 'Gewichtete Anzahl der Terminüberschreitungen',
  SUM_DELAYED_WORK = 'Summe der verspäteten Arbeit',
  SUM_WEIGHTED_DELAYED_WORK = 'Summe der gewichteten verspäteten Arbeit',
  SUM_SETUP_TIME = 'Summe der Rüstzeiten',
}
