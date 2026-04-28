import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { PrescriptionFormComponent } from './prescription-form.component';
import { PrescriptionService } from '../services/prescription.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('PrescriptionFormComponent', () => {
  let component: PrescriptionFormComponent;
  let fixture: ComponentFixture<PrescriptionFormComponent>;
  let prescriptionService: jasmine.SpyObj<PrescriptionService>;

  beforeEach(async () => {
    prescriptionService = jasmine.createSpyObj<PrescriptionService>('PrescriptionService', ['create']);
    prescriptionService.create.and.returnValue(of({ _id: 'prescription-1' } as any));

    await TestBed.configureTestingModule(
      buildComponentTestingModule(PrescriptionFormComponent, {
        providers: [
          { provide: PrescriptionService, useValue: prescriptionService },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'consultationId' ? 'consultation-1' : null),
                },
              },
            },
          },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(PrescriptionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
