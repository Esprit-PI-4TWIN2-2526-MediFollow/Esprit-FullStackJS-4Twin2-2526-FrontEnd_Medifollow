/// <reference types="jasmine" />

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CoordinatorFollowUpService } from './coordinator-follow-up.service';

describe('CoordinatorFollowUpService', () => {
  let service: CoordinatorFollowUpService;
  let httpMock: HttpTestingController;

  const primaryUrl = 'http://localhost:3000/coordinator/follow-up/protocol';
  const fallbackUrl = 'http://localhost:3000/api/coordinator/follow-up/protocol';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoordinatorFollowUpService]
    });

    service = TestBed.inject(CoordinatorFollowUpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map protocol list response from primary endpoint', () => {
    service.getProtocol().subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].patientId).toBe('patient-1');
      expect(rows[0].patientName).toBe('Alice Martin');
      expect(rows[0].patientDepartment).toBe('Cardiology');
      expect(rows[0].updatedAt).toBe('2026-04-17T08:00:00.000Z');
      expect(rows[0].statuses.find((status) => status.key === 'questionnaireCompleted')?.done).toBeTrue();
      expect(rows[0].statuses.find((status) => status.key === 'symptomsSubmitted')?.done).toBeFalse();
    });

    const request = httpMock.expectOne(primaryUrl);
    expect(request.request.method).toBe('GET');
    request.flush({
      patients: [
        {
          patientId: 'patient-1',
          patient: {
            firstName: 'Alice',
            lastName: 'Martin',
            email: 'alice@example.com',
            department: 'Cardiology'
          },
          questionnaireCompleted: true,
          symptomsStatus: 'pending',
          updatedAt: '2026-04-17T08:00:00.000Z'
        }
      ]
    });
  });

  it('should fallback to api endpoint when primary endpoint fails', () => {
    service.getProtocol().subscribe((rows) => {
      expect(rows.length).toBe(1);
      expect(rows[0].patientId).toBe('patient-2');
      expect(rows[0].statuses.find((status) => status.key === 'coordinatorValidation')?.done).toBeTrue();
    });

    const first = httpMock.expectOne(primaryUrl);
    first.flush('error', { status: 500, statusText: 'Server Error' });

    const second = httpMock.expectOne(fallbackUrl);
    expect(second.request.method).toBe('GET');
    second.flush({
      items: [
        {
          patientId: 'patient-2',
          patientName: 'Bruno Leroy',
          validated: true,
          createdAt: '2026-04-17T09:00:00.000Z'
        }
      ]
    });
  });

  it('should map protocol details and build questionnaire fallback history', () => {
    service.getProtocolDetails('patient-1').subscribe((details) => {
      expect(details.patientId).toBe('patient-1');
      expect(details.patientName).toBe('Alice Martin');
      expect(details.questionnaireExpectedCount).toBe(2);
      expect(details.questionnaireResponses.length).toBe(1);
      expect(details.questionnaireResponses[0].status).toContain('1/2 submitted');
      expect(details.symptoms).toEqual([{ label: 'Pain', value: 'Low' }]);
      expect(details.vitalSigns).toEqual([
        { label: 'Blood Pressure', value: '120/80' },
        { label: 'Heart Rate', value: '76' }
      ]);
      expect(details.validationNote).toBe('Follow up tomorrow');
    });

    const request = httpMock.expectOne(`${primaryUrl}/patient-1`);
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        patientId: 'patient-1',
        patient: {
          firstName: 'Alice',
          lastName: 'Martin',
          email: 'alice@example.com',
          department: 'Cardiology'
        },
        questionnaire: {
          expectedCount: 2,
          completedCount: 1,
          latestSubmissionAt: '2026-04-17T10:00:00.000Z'
        },
        symptoms: [{ label: 'Pain', value: 'Low' }],
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 76
        },
        validationNote: 'Follow up tomorrow'
      }
    });
  });

  it('should propagate error after fallback failure', () => {
    let caughtError: unknown;

    service.getProtocol().subscribe({
      next: () => fail('Expected request to fail'),
      error: (error) => {
        caughtError = error;
      }
    });

    httpMock.expectOne(primaryUrl).flush('primary down', { status: 500, statusText: 'Server Error' });
    httpMock.expectOne(fallbackUrl).flush('fallback down', { status: 500, statusText: 'Server Error' });

    expect(caughtError).toBeTruthy();
  });
});