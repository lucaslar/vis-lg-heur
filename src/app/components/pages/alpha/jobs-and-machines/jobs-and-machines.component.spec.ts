import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsAndMachinesComponent } from './jobs-and-machines.component';

describe('JobsAndMachinesComponent', () => {
  let component: JobsAndMachinesComponent;
  let fixture: ComponentFixture<JobsAndMachinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsAndMachinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsAndMachinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
