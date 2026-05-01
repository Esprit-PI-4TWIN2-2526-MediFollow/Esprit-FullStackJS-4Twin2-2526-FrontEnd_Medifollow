import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleManageComponent } from './role-manage.component';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('RoleManageComponent', () => {
  let component: RoleManageComponent;
  let fixture: ComponentFixture<RoleManageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(RoleManageComponent),
    ).compileComponents();

    fixture = TestBed.createComponent(RoleManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
