import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MachineTablesComponent } from './machine-tables.component';

describe('MachineTablesComponent', () => {
  let component: MachineTablesComponent;
  let fixture: ComponentFixture<MachineTablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MachineTablesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
