import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulingGanttComponent } from './scheduling-gantt.component';

describe('SchedulingGanttComponent', () => {
  let component: SchedulingGanttComponent;
  let fixture: ComponentFixture<SchedulingGanttComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchedulingGanttComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulingGanttComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
