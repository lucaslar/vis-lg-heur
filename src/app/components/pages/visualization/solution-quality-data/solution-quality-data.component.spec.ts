import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SolutionQualityDataComponent } from './solution-quality-data.component';

describe('SolutionQualityDataComponent', () => {
  let component: SolutionQualityDataComponent;
  let fixture: ComponentFixture<SolutionQualityDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SolutionQualityDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SolutionQualityDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
