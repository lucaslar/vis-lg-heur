import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsTerminationComponent } from './jobs-termination.component';

describe('JobsTerminationComponent', () => {
  let component: JobsTerminationComponent;
  let fixture: ComponentFixture<JobsTerminationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsTerminationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsTerminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
