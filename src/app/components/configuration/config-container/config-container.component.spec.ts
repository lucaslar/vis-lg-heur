import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigContainerComponent } from './config-container.component';

describe('ConfigContainerComponent', () => {
  let component: ConfigContainerComponent;
  let fixture: ComponentFixture<ConfigContainerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigContainerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
