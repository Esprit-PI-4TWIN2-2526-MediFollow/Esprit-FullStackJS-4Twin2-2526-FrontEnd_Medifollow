import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { SymptomsDetailsComponent } from './symptoms-details.component';
import { NurseSymptomsResponse, SymptomsNurseService } from '../services/symptoms-nurse.service';

describe('SymptomsDetailsComponent', () => {
  let component: SymptomsDetailsComponent;
  let fixture: ComponentFixture<SymptomsDetailsComponent>;
  let symptomsNurseService: jasmine.SpyObj<SymptomsNurseService>;
  let router: Router;
  let responseId: string | null;

  const response: NurseSymptomsResponse = {
    _id: 'response-1',
    patientName: 'Jane Patient',
    submittedAt: '2026-04-17T08:30:00.000Z',
    validated: false,
    validationNote: 'Initial note',
    vitals: {
      bloodPressure: '145/95',
      heartRate: 112,
      temperature: 37.9,
      weight: 80,
    },
    answers: [
      { question: 'Pain level', answer: 7 },
      { label: 'Symptoms', value: ['Cough', 'Fatigue'] },
      { label: 'Dressing changed', value: true },
    ],
  };

  beforeEach(async () => {
    responseId = 'response-1';
    symptomsNurseService = jasmine.createSpyObj<SymptomsNurseService>(
      'SymptomsNurseService',
      ['getResponseDetails', 'validateResponse', 'signalProblem']
    );
    symptomsNurseService.getResponseDetails.and.returnValue(of(response));
    symptomsNurseService.validateResponse.and.returnValue(of({
      ...response,
      validated: true,
      validationNote: 'Looks stable',
    }));
    symptomsNurseService.signalProblem.and.returnValue(of({
      ...response,
      validated: true,
      issueReported: true,
      validationNote: 'Escalate',
    }));

    await TestBed.configureTestingModule({
      declarations: [SymptomsDetailsComponent],
      imports: [CommonModule, RouterTestingModule],
      providers: [
        { provide: SymptomsNurseService, useValue: symptomsNurseService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => responseId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'error');

    fixture = TestBed.createComponent(SymptomsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load response details', () => {
    expect(component).toBeTruthy();
    expect(symptomsNurseService.getResponseDetails).toHaveBeenCalledWith('response-1');
    expect(component.response).toEqual(response);
    expect(component.validationNote).toBe('Initial note');
    expect(component.isLoading).toBeFalse();
  });

  it('should format submitted answer rows', () => {
    expect(component.answerRows).toEqual([
      { label: 'Pain level', value: '7' },
      { label: 'Symptoms', value: 'Cough, Fatigue' },
      { label: 'Dressing changed', value: 'Yes' },
    ]);
  });

  it('should expose vital values, status labels and tone classes', () => {
    expect(component.getVitalDisplayValue('bloodPressure')).toBe('145/95');
    expect(component.getVitalStatusLabel('bloodPressure')).toBe('Alert');
    expect(component.getVitalToneClasses('bloodPressure')).toContain('rose');

    component.response = { ...response, vitals: { heartRate: 104, temperature: 37.8, weight: 70 } };

    expect(component.getVitalStatusLabel('heartRate')).toBe('Warning');
    expect(component.getVitalStatusLabel('temperature')).toBe('Warning');
    expect(component.getVitalToneClasses('weight')).toContain('emerald');
  });

  it('should update the note from a textarea input', () => {
    component.onNoteInput({ target: { value: 'Updated note' } } as unknown as Event);

    expect(component.validationNote).toBe('Updated note');
  });

  it('should validate the response and show a success message', () => {
    component.validationNote = 'Looks stable';

    component.validateResponse();

    expect(symptomsNurseService.validateResponse).toHaveBeenCalledWith('response-1', 'Looks stable');
    expect(component.response?.validated).toBeTrue();
    expect(component.successMessage).toBe('Response validated successfully.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should signal a problem and show a success message', () => {
    component.validationNote = 'Escalate';

    component.signalProblem();

    expect(symptomsNurseService.signalProblem).toHaveBeenCalledWith('response-1', 'Escalate');
    expect(component.response?.issueReported).toBeTrue();
    expect(component.successMessage).toBe('Problem reported successfully.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should not submit validation actions in read-only mode', () => {
    symptomsNurseService.validateResponse.calls.reset();
    symptomsNurseService.signalProblem.calls.reset();
    component.response = { ...response, validated: true };

    component.validateResponse();
    component.signalProblem();

    expect(symptomsNurseService.validateResponse).not.toHaveBeenCalled();
    expect(symptomsNurseService.signalProblem).not.toHaveBeenCalled();
  });

  it('should expose a load error when the response id is missing', () => {
    responseId = null;
    const nextFixture = TestBed.createComponent(SymptomsDetailsComponent);
    const nextComponent = nextFixture.componentInstance;

    nextFixture.detectChanges();

    expect(nextComponent.errorMessage).toBe('Symptoms response not found.');
    expect(nextComponent.isLoading).toBeFalse();
  });

  it('should expose action errors', () => {
    symptomsNurseService.validateResponse.and.returnValue(throwError(() => new Error('network')));

    component.validateResponse();

    expect(component.errorMessage).toBe('Unable to validate this response.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should navigate back to the symptoms queue', () => {
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/nurse/symptoms']);
  });
});
