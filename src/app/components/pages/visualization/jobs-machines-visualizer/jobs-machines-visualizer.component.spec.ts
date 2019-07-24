import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JobsMachinesVisualizerComponent } from './jobs-machines-visualizer.component';

describe('JobsMachinesVisualizerComponent', () => {
  let component: JobsMachinesVisualizerComponent;
  let fixture: ComponentFixture<JobsMachinesVisualizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JobsMachinesVisualizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JobsMachinesVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
