import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ConsultationDetailComponent } from './consultation-detail.component';
import { ConsultationService } from '../services/consultation.service';
import { MedicalDocumentService } from '../services/medical-document.service';
import { PrescriptionService } from '../services/prescription.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('ConsultationDetailComponent', () => {
  let component: ConsultationDetailComponent;
  let fixture: ComponentFixture<ConsultationDetailComponent>;
  let consultationService: jasmine.SpyObj<ConsultationService>;
  let prescriptionService: jasmine.SpyObj<PrescriptionService>;
  let documentService: jasmine.SpyObj<MedicalDocumentService>;
  const consultation = {
    _id: 'consultation-1',
    patient: {
      _id: 'patient-1',
      firstName: 'Jane',
      lastName: 'Patient',
    },
    doctor: {
      _id: 'doctor-1',
      firstName: 'John',
      lastName: 'Doctor',
    },
    status: 'pending',
    type: 'scheduled',
    scheduledAt: '2026-04-28T09:00:00.000Z',
    reason: 'Routine follow-up',
  } as any;

  beforeEach(async () => {
    localStorage.setItem('user', JSON.stringify({ _id: 'doctor-1', role: 'DOCTOR' }));
    consultationService = jasmine.createSpyObj<ConsultationService>('ConsultationService', [
      'findOne',
      'start',
      'end',
      'cancel',
    ]);
    prescriptionService = jasmine.createSpyObj<PrescriptionService>('PrescriptionService', [
      'findByConsultation',
    ]);
    documentService = jasmine.createSpyObj<MedicalDocumentService>('MedicalDocumentService', [
      'findByConsultation',
    ]);

    consultationService.findOne.and.returnValue(of(consultation));
    consultationService.start.and.returnValue(of(consultation));
    consultationService.end.and.returnValue(of(consultation));
    consultationService.cancel.and.returnValue(of(consultation));
    prescriptionService.findByConsultation.and.returnValue(of([]));
    documentService.findByConsultation.and.returnValue(of([]));

    await TestBed.configureTestingModule(
      buildComponentTestingModule(ConsultationDetailComponent, {
        providers: [
          { provide: ConsultationService, useValue: consultationService },
          { provide: PrescriptionService, useValue: prescriptionService },
          { provide: MedicalDocumentService, useValue: documentService },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: {
                  get: (key: string) => (key === 'id' ? 'consultation-1' : null),
                },
              },
            },
          },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(ConsultationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    localStorage.clear();
  });
});
