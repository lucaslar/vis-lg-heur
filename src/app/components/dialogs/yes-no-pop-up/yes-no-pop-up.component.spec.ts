import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { YesNoPopUpComponent } from './yes-no-pop-up.component';

describe('YesNoPopUpComponent', () => {
  let component: YesNoPopUpComponent;
  let fixture: ComponentFixture<YesNoPopUpComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ YesNoPopUpComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(YesNoPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
