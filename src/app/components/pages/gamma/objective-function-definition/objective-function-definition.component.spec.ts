import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectiveFunctionDefinitionComponent } from './objective-function-definition.component';

describe('ObjectiveFunctionDefinitionComponent', () => {
  let component: ObjectiveFunctionDefinitionComponent;
  let fixture: ComponentFixture<ObjectiveFunctionDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectiveFunctionDefinitionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectiveFunctionDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
