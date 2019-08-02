import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsWeightingComponent } from './jobs-weighting.component';

describe('JobsWeightingComponent', () => {
  let component: JobsWeightingComponent;
  let fixture: ComponentFixture<JobsWeightingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsWeightingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsWeightingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
