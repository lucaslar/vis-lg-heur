export enum ObjectiveFunction {
  CYCLE_TIME = 'Gesamtdauer',
  SUM_FINISHING_TIMESTAMPS = 'Summe der Fertigstellungszeitpunkte',
  MEAN_DELAY = 'mittlere Verspätungszeit',
  NUMBER_OF_DELAYS = 'Anzahl der Terminüberschreitungen',
  // TODO: Sum of delays?

  SUM_SETUP_TIME = 'Summe der Rüstzeiten'
}

// TODO: Add and implement more
// TODO: Beta: weight and obj. func. weighted xy?
// TODO: Verspätung (Herrmann), nicht negativ <-> Verspätung (Buch Ablaufplanung) kann negativ sein, Terminüberschreitung nicht
