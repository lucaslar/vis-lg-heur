/**
 * List of different types for classifying scheduling log messages.
 */
export enum LogEventType {
  JOB_QUEUE = 'Warteschlange',
  PRODUCTION_START = 'Abarbeitungsstartzeitpunkt',
  HEURISTIC_BASED_SORTING = 'Vorgehen des heuristischen Verfahrens'
}
