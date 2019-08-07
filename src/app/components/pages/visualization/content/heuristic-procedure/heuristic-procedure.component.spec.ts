import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HeuristicProcedureComponent } from './heuristic-procedure.component';

describe('HeuristicProcedureComponent', () => {
  let component: HeuristicProcedureComponent;
  let fixture: ComponentFixture<HeuristicProcedureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HeuristicProcedureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HeuristicProcedureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
