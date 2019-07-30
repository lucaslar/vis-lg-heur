import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulingLogComponent } from './scheduling-log.component';

describe('SchedulingLogComponent', () => {
  let component: SchedulingLogComponent;
  let fixture: ComponentFixture<SchedulingLogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SchedulingLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SchedulingLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
