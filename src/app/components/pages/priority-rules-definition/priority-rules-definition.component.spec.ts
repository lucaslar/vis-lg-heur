import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PriorityRulesDefinitionComponent } from './priority-rules-definition.component';

describe('PriorityRulesDefinitionComponent', () => {
  let component: PriorityRulesDefinitionComponent;
  let fixture: ComponentFixture<PriorityRulesDefinitionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PriorityRulesDefinitionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PriorityRulesDefinitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
