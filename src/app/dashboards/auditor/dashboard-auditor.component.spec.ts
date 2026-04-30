import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DashboardAuditorComponent } from './dashboard-auditor.component';
import { AuditService } from '../../services/audit.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('DashboardAuditorComponent', () => {
  let component: DashboardAuditorComponent;
  let fixture: ComponentFixture<DashboardAuditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule(
      buildComponentTestingModule(DashboardAuditorComponent, {
        providers: [
          {
            provide: AuditService,
            useValue: {
              getReport: () => of({ total: 0, countsByAction: {}, topEntities: [], raw: null }),
              getLogs: () => of({ items: [], total: 0, page: 1, limit: 6 }),
            },
          },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(DashboardAuditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
