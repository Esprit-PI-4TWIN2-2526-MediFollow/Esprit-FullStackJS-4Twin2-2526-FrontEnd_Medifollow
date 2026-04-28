import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSuperAdminComponent } from './dashboard-super-admin.component';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('DashboardSuperAdminComponent', () => {
  let component: DashboardSuperAdminComponent;
  let fixture: ComponentFixture<DashboardSuperAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(DashboardSuperAdminComponent),
    ).compileComponents();

    fixture = TestBed.createComponent(DashboardSuperAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
