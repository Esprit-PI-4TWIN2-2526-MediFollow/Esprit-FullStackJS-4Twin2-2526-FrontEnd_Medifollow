import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPatientComponent } from './dashboard-patient.component';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('DashboardPatientComponent', () => {
  let component: DashboardPatientComponent;
  let fixture: ComponentFixture<DashboardPatientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(DashboardPatientComponent),
    ).compileComponents();

    fixture = TestBed.createComponent(DashboardPatientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
