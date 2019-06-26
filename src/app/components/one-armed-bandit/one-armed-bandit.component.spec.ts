import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OneArmedBanditComponent } from './one-armed-bandit.component';

describe('OneArmedBanditComponent', () => {
  let component: OneArmedBanditComponent;
  let fixture: ComponentFixture<OneArmedBanditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OneArmedBanditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OneArmedBanditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
