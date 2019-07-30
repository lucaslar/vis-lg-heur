import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetUpTimesDefinitionComponent } from './set-up-times-definition.component';

describe('SetUpTimesDefinitionComponent', () => {
  let component: SetUpTimesDefinitionComponent;
  let fixture: ComponentFixture<SetUpTimesDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetUpTimesDefinitionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetUpTimesDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
