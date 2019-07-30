import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineConfigComponent } from './machine-config.component';

describe('MachineConfigComponent', () => {
  let component: MachineConfigComponent;
  let fixture: ComponentFixture<MachineConfigComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MachineConfigComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
