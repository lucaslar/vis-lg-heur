import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeuristicsSelectionComponent } from './heuristics-selection.component';

describe('HeuristicsSelectionComponent', () => {
  let component: HeuristicsSelectionComponent;
  let fixture: ComponentFixture<HeuristicsSelectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeuristicsSelectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeuristicsSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
