import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolutionQualityVisualizerComponent } from './solution-quality-visualizer.component';

describe('SolutionQualityVisualizerComponent', () => {
  let component: SolutionQualityVisualizerComponent;
  let fixture: ComponentFixture<SolutionQualityVisualizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolutionQualityVisualizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionQualityVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
