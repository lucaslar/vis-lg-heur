/**
 * List of all selectable priority rules.
 */
export enum PriorityRule {
  FCFS = 'First come, first serve',
  KOZ = 'Kürzeste-Operationszeit-Regel',
  KPZ = 'Kürzeste-Pufferzeit-Regel',
  CRSPT = 'CR+SPT-Regel',
  MOD = 'Modified-Operational-Due-Date-Regel',
  CR = 'CR-Regel',
  EDD = 'Earliest-Due-Date-Regel',
  FEZ = 'Frühster Endzeitpunkt',
  ODD = 'Operational-Due-Date-Regel',
  SOPN = 'Pufferzeit pro verbleibende Operationen',
  SOPT = 'Pufferzeit pro verbleibender Bearbeitungszeit',
  SPTT = 'Shortest Processing Time Truncated',

  // Additional implementation / Not stated in Herrmann: Übungsbuch Losbildung und Fertigungssteuerung (2018):
  SZ = 'Schlupfzeitregel (verbleibende Schlupfzeit)'

}
