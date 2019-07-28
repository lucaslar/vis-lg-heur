import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDataVisualizerComponent } from './general-data-visualizer.component';

describe('GeneralDataVisualizerComponent', () => {
  let component: GeneralDataVisualizerComponent;
  let fixture: ComponentFixture<GeneralDataVisualizerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GeneralDataVisualizerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralDataVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
