import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/user/users.service';
import { NurseSymptomsResponse, SymptomsNurseService } from './symptoms-nurse.service';

describe('SymptomsNurseService', () => {
  let service: SymptomsNurseService;
  let httpMock: HttpTestingController;
  let usersService: jasmine.SpyObj<UsersService>;

  const apiUrl = 'http://localhost:3000/symptoms';

  beforeEach(() => {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['getUsers']);
    usersService.getUsers.and.returnValue(of([
      {
        _id: 'patient-1',
        firstName: 'Jane',
        lastName: 'Patient',
        email: 'jane@example.com',
        assignedDepartment: 'Cardiology',
      } as Users,
      {
        _id: 'patient-2',
        firstName: 'Nora',
        lastName: 'Neuro',
        email: 'nora@example.com',
        assignedDepartment: 'Neurology',
      } as Users,
    ]));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SymptomsNurseService,
        { provide: UsersService, useValue: usersService },
      ],
    });

    service = TestBed.inject(SymptomsNurseService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('user', JSON.stringify({
      _id: 'nurse-1',
      firstName: 'Nina',
      lastName: 'Nurse',
      assignedDepartment: 'Cardiology',
    }));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should enrich, filter by current nurse department and sort latest responses first', () => {
    let receivedResponses: NurseSymptomsResponse[] = [];

    service.getResponsesForNurse().subscribe((responses) => {
      receivedResponses = responses;
    });

    const request = httpMock.expectOne(`${apiUrl}/response`);
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        _id: 'response-old',
        patientId: 'patient-1',
        createdAt: '2026-04-16T08:00:00.000Z',
        validated: true,
      },
      {
        _id: 'response-neuro',
        patientId: 'patient-2',
        createdAt: '2026-04-17T08:00:00.000Z',
        validated: false,
      },
      {
        _id: 'response-new',
        patientId: 'patient-1',
        submittedAt: '2026-04-17T12:00:00.000Z',
        validated: false,
      },
    ]);

    expect(receivedResponses.map((response) => response._id)).toEqual([
      'response-new',
      'response-old',
    ]);
    expect(receivedResponses[0].patientName).toBe('Jane Patient');
    expect(receivedResponses[0].patientDepartment).toBe('Cardiology');
    expect(receivedResponses[0].patientEmail).toBe('jane@example.com');
  });

  it('should return all enriched responses when the current nurse has no department', () => {
    localStorage.setItem('user', JSON.stringify({ _id: 'nurse-1' }));
    let receivedResponses: NurseSymptomsResponse[] = [];

    service.getResponsesForNurse().subscribe((responses) => {
      receivedResponses = responses;
    });

    httpMock.expectOne(`${apiUrl}/response`).flush([
      { _id: 'response-1', patientId: 'patient-1' },
      { _id: 'response-2', patientId: 'patient-2' },
    ]);

    expect(receivedResponses.map((response) => response.patientName)).toEqual([
      'Jane Patient',
      'Nora Neuro',
    ]);
  });

  it('should expose pending responses and pending count', () => {
    let pendingCount = -1;

    service.getPendingCount().subscribe((count) => {
      pendingCount = count;
    });

    httpMock.expectOne(`${apiUrl}/response`).flush([
      { _id: 'response-1', patientId: 'patient-1', validated: false },
      { _id: 'response-2', patientId: 'patient-1', validated: true },
      { _id: 'response-3', patientId: 'patient-1' },
    ]);

    expect(pendingCount).toBe(2);
  });

  it('should return an empty response list for a 404 backend response', () => {
    let receivedResponses: NurseSymptomsResponse[] | undefined;

    service.getResponsesForNurse().subscribe((responses) => {
      receivedResponses = responses;
    });

    httpMock
      .expectOne(`${apiUrl}/response`)
      .flush({ message: 'No responses' }, { status: 404, statusText: 'Not Found' });

    expect(receivedResponses).toEqual([]);
  });

  it('should return response details from the nurse queue', () => {
    let responseDetails: NurseSymptomsResponse | undefined;

    service.getResponseDetails('response-1').subscribe((response) => {
      responseDetails = response;
    });

    httpMock.expectOne(`${apiUrl}/response`).flush([
      { _id: 'response-1', patientId: 'patient-1' },
      { _id: 'response-2', patientId: 'patient-1' },
    ]);

    expect(responseDetails?._id).toBe('response-1');
  });

  it('should patch validation details with current nurse identity', () => {
    service.validateResponse('response-1', 'Looks stable').subscribe((response) => {
      expect(response.validated).toBeTrue();
    });

    const request = httpMock.expectOne(`${apiUrl}/response/response-1/validate`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      validated: true,
      validationNote: 'Looks stable',
      validatedBy: 'nurse-1',
      validatedByName: 'Nina Nurse',
      issueReported: false,
    }));
    expect(request.request.body.validatedAt).toEqual(jasmine.any(String));
    request.flush({ _id: 'response-1', validated: true });
  });

  it('should patch a signaled problem with current nurse identity', () => {
    service.signalProblem('response-1', 'Escalate to doctor').subscribe((response) => {
      expect(response.issueReported).toBeTrue();
    });

    const request = httpMock.expectOne(`${apiUrl}/response/response-1/signal-problem`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(jasmine.objectContaining({
      issueReported: true,
      validationNote: 'Escalate to doctor',
      validatedBy: 'nurse-1',
      validatedByName: 'Nina Nurse',
    }));
    request.flush({ _id: 'response-1', issueReported: true });
  });
});
