export enum ObjectiveFunction {
  CYCLE_TIME = 'Gesamtdauer',
  // MAX_DELAY = 'Maximale Verspätung',
  SUM_FINISHING_TIMESTAMPS = 'Summe der Fertigstellungszeitpunkte',
  SUM_WEIGHTED_FINISHING_TIMESTAMPS = 'Gewichtete Summe der Fertigstellungszeitpunkte',
  // SUM_DEADLINE_EXCEEDANCES = 'Summe der Terminüberschreitungen'
  // SUM_WEIGHTED_DEADLINE_EXCEEDANCES = 'Summe der gewichteten Terminüberschreitungen'
  NUMBER_OF_DEADLINE_EXCEEDANCES = 'Anzahl der Terminüberschreitungen',
  SUM_WEIGHTED_DEADLINE_EXCEEDANCES = 'Gewichtete Anzahl der Terminüberschreitungen',


  SUM_SETUP_TIME = 'Summe der Rüstzeiten',
  MEAN_DELAY = 'Mittlere Verspätungszeit',

}

// TODO: Add and implement more
// TODO: Verspätung (Herrmann), nicht negativ <-> Verspätung (Buch Ablaufplanung) kann negativ sein, Terminüberschreitung nicht
// TODO: Completely implement as in 'Ablaufplanung'?
