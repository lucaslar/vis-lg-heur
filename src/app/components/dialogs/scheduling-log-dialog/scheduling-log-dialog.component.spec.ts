import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulingLogDialogComponent } from './scheduling-log-dialog.component';

describe('SchedulingLogDialogComponent', () => {
  let component: SchedulingLogDialogComponent;
  let fixture: ComponentFixture<SchedulingLogDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchedulingLogDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulingLogDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
