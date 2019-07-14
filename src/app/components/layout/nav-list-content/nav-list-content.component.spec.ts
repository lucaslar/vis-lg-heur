import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NavListContentComponent } from './nav-list-content.component';

describe('NavListContentComponent', () => {
  let component: NavListContentComponent;
  let fixture: ComponentFixture<NavListContentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NavListContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavListContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
