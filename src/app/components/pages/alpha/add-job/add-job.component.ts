import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {StorageService} from '../../../../services/storage.service';
import {Job, MachineTimeForJob, SetupTime} from '../../../../model/scheduling/Job';
import {DefinableValue} from '../../../../model/internal/value-definition/DefinableValue';
import {DefinitionStatus} from '../../../../model/internal/value-definition/DefinitionStatus';

@Component({
  selector: 'app-add-job',
  templateUrl: './add-job.component.html',
  styleUrls: ['./add-job.component.css']
})
export class AddJobComponent implements OnInit {

  private _jobNameInput: string;
  private _isAutomaticallyGenerateTimes: boolean;
  private _isShuffleMachineOrder: boolean;

  @Input() isMaxJobsConfigured: boolean;
  @Output() autoGenerateTimesChanged: EventEmitter<boolean> = new EventEmitter();
  @Output() newCreatedJob: EventEmitter<Job> = new EventEmitter();

  constructor(public storage: StorageService) {
  }

  ngOnInit(): void {
    this.isAutomaticallyGenerateTimes = true;
    this.isShuffleMachineOrder = false;
  }

  createNewJob(): void {
    const job = new Job(this.jobNameInput);
    this.jobNameInput = undefined;
    this.generateMachineOrderForJob(job);
    if (this.storage.nrOfMachines > 1 && this.isShuffleMachineOrder) {
      job.machineTimes = job.machineTimes.sort(() => Math.random() - 0.5);
    }
    if (this.storage.getValueDefinitionStatus(DefinableValue.BETA_SETUP_TIMES) !== DefinitionStatus.NOT_DEFINED) {
      job.setupTimesToOtherJobs = this.storage.jobs.map(_job => new SetupTime(_job.id));
    }
    this.newCreatedJob.emit(job);
  }

  private generateMachineOrderForJob(job: Job): void {
    job.machineTimes = [];
    for (let i = 1; i <= this.storage.nrOfMachines; i++) {
      job.machineTimes.push(new MachineTimeForJob(
        i, this.isAutomaticallyGenerateTimes ? (Math.floor(Math.random() * 10) + 1) : undefined
      ));
    }
  }

  get jobNameInput(): string {
    return this._jobNameInput;
  }

  set jobNameInput(value: string) {
    this._jobNameInput = value;
  }

  get isAutomaticallyGenerateTimes(): boolean {
    return this._isAutomaticallyGenerateTimes;
  }

  set isAutomaticallyGenerateTimes(value: boolean) {
    this._isAutomaticallyGenerateTimes = value;
    this.autoGenerateTimesChanged.emit(value);
  }

  get isShuffleMachineOrder(): boolean {
    return this._isShuffleMachineOrder;
  }

  set isShuffleMachineOrder(value: boolean) {
    this._isShuffleMachineOrder = value;
  }
}
