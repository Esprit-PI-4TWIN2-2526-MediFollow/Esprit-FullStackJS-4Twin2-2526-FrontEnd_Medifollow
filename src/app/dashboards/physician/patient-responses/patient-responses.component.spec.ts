import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientResponsesComponent } from './patient-responses.component';

describe('PatientResponsesComponent', () => {
  let component: PatientResponsesComponent;
  let fixture: ComponentFixture<PatientResponsesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatientResponsesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
