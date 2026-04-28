import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCoordinatorComponent } from './dashboard-coordinator.component';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('DashboardCoordinatorComponent', () => {
  let component: DashboardCoordinatorComponent;
  let fixture: ComponentFixture<DashboardCoordinatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(DashboardCoordinatorComponent),
    ).compileComponents();

    fixture = TestBed.createComponent(DashboardCoordinatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
