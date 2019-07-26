import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulingChartComponent } from './scheduling-chart.component';

describe('SchedulingChartComponent', () => {
  let component: SchedulingChartComponent;
  let fixture: ComponentFixture<SchedulingChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchedulingChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulingChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
