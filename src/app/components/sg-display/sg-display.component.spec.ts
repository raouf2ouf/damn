import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SgDisplayComponent } from './sg-display.component';

describe('SgDisplayComponent', () => {
  let component: SgDisplayComponent;
  let fixture: ComponentFixture<SgDisplayComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SgDisplayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SgDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
