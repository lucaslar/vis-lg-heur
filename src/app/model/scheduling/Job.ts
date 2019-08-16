/**
 * Jobs with all information the user has access to (and ID).
 */
export class Job {

  /**
   * Unique ID
   */
  id: number;

  /**
   * Name of the job
   */
  name: string;

  /**
   * Times for single operations of job (and order on machines).
   */
  machineTimes: MachineTimeForJob[];

  /**
   * Due date of the job
   */
  dueDate: number;

  /**
   * Times for setting up a machine before starting witch the other jobs
   */
  setupTimesToOtherJobs: SetupTime[];

  /**
   * Job weighting
   */
  weight: number;

  constructor(_name: string) {
    this.name = _name;
  }

}

/**
 * Representation of a task on a certain machine.
 */
export class MachineTimeForJob {

  /**
   * Number of the performing this task
   */
  machineNr: number;

  /**
   * Time for performing the task
   */
  timeOnMachine: number;

  constructor(machineNr: number, timeOnMachine?: number) {
    this.machineNr = machineNr;
    this.timeOnMachine = timeOnMachine;
  }
}

/**
 * Setup time relation to another job.
 */
export class SetupTime {

  /**
   * ID of the job this setup time refers to
   */
  idTo: number;

  /**
   * Duration for setting up the machine before starting with production of the defined job
   */
  duration: number;

  constructor(idTo: number) {
    this.idTo = idTo;
  }
}
