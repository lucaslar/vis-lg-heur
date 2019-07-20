import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IconNumberInputComponent } from './icon-number-input.component';

describe('IconNumberInputComponent', () => {
  let component: IconNumberInputComponent;
  let fixture: ComponentFixture<IconNumberInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IconNumberInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IconNumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
