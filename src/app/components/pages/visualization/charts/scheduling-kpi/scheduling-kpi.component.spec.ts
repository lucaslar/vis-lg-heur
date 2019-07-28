import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulingKpiComponent } from './scheduling-kpi.component';

describe('SchedulingKpiComponent', () => {
  let component: SchedulingKpiComponent;
  let fixture: ComponentFixture<SchedulingKpiComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchedulingKpiComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulingKpiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
