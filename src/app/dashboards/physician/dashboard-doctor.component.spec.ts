import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgChartsModule } from 'ng2-charts';

import { DashboardDoctorComponent } from './dashboard-doctor.component';

describe('DashboardPhysicianComponent', () => {
  let component: DashboardDoctorComponent;
  let fixture: ComponentFixture<DashboardDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardDoctorComponent],
      imports: [FormsModule, HttpClientTestingModule, NgChartsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
