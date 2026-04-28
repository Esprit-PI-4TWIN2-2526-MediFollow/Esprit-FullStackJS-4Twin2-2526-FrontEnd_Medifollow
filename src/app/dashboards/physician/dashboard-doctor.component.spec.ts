import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgChartsModule } from 'ng2-charts';

import { DashboardDoctorComponent } from './dashboard-doctor.component';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('DashboardPhysicianComponent', () => {
  let component: DashboardDoctorComponent;
  let fixture: ComponentFixture<DashboardDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(DashboardDoctorComponent, {
        imports: [NgChartsModule],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(DashboardDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
