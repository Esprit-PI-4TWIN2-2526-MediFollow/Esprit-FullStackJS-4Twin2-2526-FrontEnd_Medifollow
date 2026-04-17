import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { SymptomsListComponent } from './symptoms-list.component';
import { NurseSymptomsResponse, SymptomsNurseService } from '../services/symptoms-nurse.service';

describe('SymptomsListComponent', () => {
  let component: SymptomsListComponent;
  let fixture: ComponentFixture<SymptomsListComponent>;
  let symptomsNurseService: jasmine.SpyObj<SymptomsNurseService>;
  let router: Router;

  const responses: NurseSymptomsResponse[] = [
    {
      _id: 'response-1',
      patientName: 'Jane Patient',
      submittedAt: '2026-04-17T08:30:00.000Z',
      validated: false,
      vitals: { heartRate: 112, temperature: 37.8, bloodPressure: '130/85', weight: 80 },
    },
    {
      _id: 'response-2',
      patientName: 'John Patient',
      submittedAt: '2026-04-17T09:30:00.000Z',
      validated: true,
      issueReported: false,
      vitals: { heartRate: 70, temperature: 36.8, bloodPressure: '115/75', weight: 70 },
    },
    {
      _id: 'response-3',
      patientName: 'Issue Patient',
      validated: true,
      issueReported: true,
      vitals: { heartRate: 45, temperature: 39, bloodPressure: '145/95', weight: 130 },
    },
  ];

  beforeEach(async () => {
    symptomsNurseService = jasmine.createSpyObj<SymptomsNurseService>(
      'SymptomsNurseService',
      ['getResponsesForNurse']
    );
    symptomsNurseService.getResponsesForNurse.and.returnValue(of(responses));

    await TestBed.configureTestingModule({
      declarations: [SymptomsListComponent],
      imports: [CommonModule, RouterTestingModule],
      providers: [
        { provide: SymptomsNurseService, useValue: symptomsNurseService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'error');

    fixture = TestBed.createComponent(SymptomsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load responses', () => {
    expect(component).toBeTruthy();
    expect(symptomsNurseService.getResponsesForNurse).toHaveBeenCalled();
    expect(component.responses).toEqual(responses);
    expect(component.isLoading).toBeFalse();
  });

  it('should filter pending and validated responses', () => {
    expect(component.pendingCount).toBe(1);
    expect(component.pendingResponses.map((response) => response._id)).toEqual(['response-1']);
    expect(component.validatedResponses.map((response) => response._id)).toEqual([
      'response-2',
      'response-3',
    ]);

    component.setFilter('pending');
    expect(component.filteredResponses.map((response) => response._id)).toEqual(['response-1']);

    component.setFilter('validated');
    expect(component.filteredResponses.map((response) => response._id)).toEqual([
      'response-2',
      'response-3',
    ]);
  });

  it('should navigate to response details when an id is present', () => {
    component.openDetails(responses[0]);
    component.openDetails({ ...responses[0], _id: '' });

    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith(['/nurse/symptoms', 'response-1']);
  });

  it('should format status labels and status classes', () => {
    expect(component.getStatusLabel(responses[0])).toBe('En attente');
    expect(component.getStatusLabel(responses[1])).toContain('Valid');
    expect(component.getStatusLabel(responses[2])).toContain('signal');
    expect(component.getStatusClasses(responses[0])).toContain('sky');
    expect(component.getStatusClasses(responses[1])).toContain('emerald');
    expect(component.getStatusClasses(responses[2])).toContain('amber');
  });

  it('should format submission time and unknown dates', () => {
    expect(component.formatSubmissionTime({ _id: 'response-missing' })).toBe('Unknown time');
    expect(component.formatSubmissionTime({ _id: 'response-invalid', submittedAt: 'bad date' })).toBe('Unknown time');
    expect(component.formatSubmissionTime(responses[0])).toContain('2026');
  });

  it('should compute vital display values and triage classes', () => {
    expect(component.getVitalDisplayValue(responses[0], 'heartRate')).toBe('112');
    expect(component.getVitalDisplayValue({ _id: 'empty', vitals: {} }, 'heartRate')).not.toBe('');
    expect(component.getVitalChipClasses(responses[2], 'bloodPressure')).toContain('rose');
    expect(component.getVitalChipClasses(responses[0], 'temperature')).toContain('amber');
    expect(component.getVitalChipClasses(responses[1], 'heartRate')).toContain('emerald');
  });

  it('should expose an error when responses cannot be loaded', () => {
    symptomsNurseService.getResponsesForNurse.and.returnValue(throwError(() => new Error('network')));

    component.ngOnInit();

    expect(component.errorMessage).toBe('Unable to load symptoms responses.');
    expect(component.isLoading).toBeFalse();
  });
});
