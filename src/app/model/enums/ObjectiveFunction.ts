export enum ObjectiveFunction {
  CYCLE_TIME = 'Gesamtdauer',
  MEAN_DELAY = 'Mittlere Verspätungszeit',
  SUM_FINISHING_TIMESTAMPS = 'Summe der Fertigstellungszeitpunkte',
  NUMBER_OF_DELAYS = 'Anzahl der Terminüberschreitungen',
  // TODO: Sum of delays?

  SUM_WEIGHTED_FINISHING_TIMESTAMPS = 'Gewichtete Summe der Fertigstellungszeitpunkte',
  SUM_WEIGHTED_DELAYS = 'Gewichtete Anzahl der Terminüberschreitungen',

  SUM_SETUP_TIME = 'Summe der Rüstzeiten'
}

// TODO: Add and implement more
// TODO: Verspätung (Herrmann), nicht negativ <-> Verspätung (Buch Ablaufplanung) kann negativ sein, Terminüberschreitung nicht
