import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineNrPopupComponent } from './machine-nr-popup.component';

describe('MachineNrPopupComponent', () => {
  let component: MachineNrPopupComponent;
  let fixture: ComponentFixture<MachineNrPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MachineNrPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNrPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
