export enum PriorityRule {
  // TODO: Rename identifiers?
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
  SZ = 'Schlupfzeitregel (verbleibende Schlupfzeit)', // Used in excel, not stated in the book
}
