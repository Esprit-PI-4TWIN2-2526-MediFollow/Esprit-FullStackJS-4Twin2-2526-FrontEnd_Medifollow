import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { SymptomsRendererComponent } from './symptoms-renderer.component';
import { SymptomsAssignedForm, SymptomsTodayResponse } from './symptoms-response.model';
import { SymptomsResponseService } from './symptoms-response.service';
import { Users } from '../../../models/users';
import { UsersService } from '../../../services/user/users.service';

describe('SymptomsRendererComponent', () => {
  let component: SymptomsRendererComponent;
  let fixture: ComponentFixture<SymptomsRendererComponent>;
  let usersService: jasmine.SpyObj<UsersService>;
  let symptomsResponseService: jasmine.SpyObj<SymptomsResponseService>;
  let router: Router;

  const assignedForm: SymptomsAssignedForm = {
    _id: 'form-1',
    title: 'Daily symptoms',
    questions: [
      {
        _id: 'pain',
        label: 'Pain level',
        type: 'scale',
        required: true,
        order: 1,
        validation: { min: 1, max: 10 },
        category: 'subjective_symptoms',
      } as any,
      {
        _id: 'temperature',
        label: 'Temperature',
        type: 'number',
        required: true,
        order: 0,
        validation: { min: 35, max: 42 },
        category: 'vital_parameters',
      } as any,
      {
        _id: 'symptoms',
        label: 'Other symptoms',
        type: 'multiple_choice',
        options: ['Cough', 'Fatigue'],
        required: true,
        order: 2,
        category: 'subjective_symptoms',
      } as any,
      {
        _id: 'visitDate',
        label: 'Visit date',
        type: 'date',
        required: false,
        order: 3,
        category: 'clinical_data',
      } as any,
    ],
  };

  const patient = {
    _id: 'patient-1',
    email: 'patient@example.com',
    role: 'patient',
  } as Users;

  beforeEach(async () => {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['getUserByEmail']);
    symptomsResponseService = jasmine.createSpyObj<SymptomsResponseService>(
      'SymptomsResponseService',
      ['getAssignedForm', 'getResponsesByDate', 'submitResponse']
    );

    usersService.getUserByEmail.and.returnValue(of(patient));
    symptomsResponseService.getAssignedForm.and.returnValue(of(assignedForm));
    symptomsResponseService.getResponsesByDate.and.returnValue(of([]));
    symptomsResponseService.submitResponse.and.returnValue(of({ saved: true }));

    await TestBed.configureTestingModule({
      declarations: [SymptomsRendererComponent],
      imports: [CommonModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: SymptomsResponseService, useValue: symptomsResponseService },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'error');
    spyOn(window, 'scrollTo');
    localStorage.setItem('user', JSON.stringify({ email: 'patient@example.com' }));

    fixture = TestBed.createComponent(SymptomsRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create, identify the patient and build controls from the assigned form', () => {
    expect(component).toBeTruthy();
    expect(usersService.getUserByEmail).toHaveBeenCalledWith('patient@example.com');
    expect(symptomsResponseService.getAssignedForm).toHaveBeenCalledWith('patient-1');
    expect(component.currentUser).toEqual({ _id: 'patient-1' });
    expect(component.questions.map((question) => question._id)).toEqual([
      'temperature',
      'pain',
      'symptoms',
      'visitDate',
    ]);
    expect(component.responseForm.contains('temperature')).toBeTrue();
    expect(component.responseForm.contains('symptoms')).toBeTrue();
    expect(component.isLoading).toBeFalse();
  });

  it('should compute progress from answered questions', () => {
    expect(component.progressPercent).toBe(0);

    component.getControl({ _id: 'temperature', label: 'Temperature', type: 'number' })?.setValue(37);
    component.getControl({ _id: 'pain', label: 'Pain level', type: 'scale' })?.setValue(4);

    expect(component.answeredQuestions).toBe(2);
    expect(component.progressPercent).toBe(50);
  });

  it('should block next step until required current step questions are valid', () => {
    component.currentStep = 0;

    expect(component.canGoNext()).toBeFalse();

    component.getControl(component.questions[0])?.setValue(37.2);

    expect(component.canGoNext()).toBeTrue();
  });

  it('should toggle multiple choice values and report checked options', () => {
    const multipleChoiceQuestion = component.questions.find((question) => question._id === 'symptoms')!;

    component.onMultipleChoiceToggleFor(multipleChoiceQuestion, 'Cough');
    component.onMultipleChoiceToggleFor(multipleChoiceQuestion, 1);

    expect(component.isOptionCheckedFor(multipleChoiceQuestion, 'Cough')).toBeTrue();
    expect(component.isOptionCheckedFor(multipleChoiceQuestion, 'Fatigue')).toBeTrue();

    component.onMultipleChoiceToggleFor(multipleChoiceQuestion, 'Cough');

    expect(component.isOptionCheckedFor(multipleChoiceQuestion, 'Cough')).toBeFalse();
  });

  it('should submit valid answers and convert multiple choice selections to option labels', () => {
    component.getControl(component.questions.find((question) => question._id === 'temperature')!)?.setValue(37.4);
    component.getControl(component.questions.find((question) => question._id === 'pain')!)?.setValue(6);
    component.onMultipleChoiceToggleFor(component.questions.find((question) => question._id === 'symptoms')!, 'Fatigue');

    component.submit();

    expect(symptomsResponseService.submitResponse).toHaveBeenCalledWith({
      patientId: 'patient-1',
      formId: 'form-1',
      answers: [
        { questionId: 'temperature', value: 37.4 },
        { questionId: 'pain', value: 6 },
        { questionId: 'symptoms', value: ['Fatigue'] },
      ],
      date: jasmine.any(Date),
    });
    expect(component.isSubmitted).toBeTrue();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should not submit in history mode or after the daily limit is reached', () => {
    component.historyDate = '2026-04-17';
    component.submit();

    component.historyDate = '';
    component.todayResponses = [{ _id: '1' }, { _id: '2' }, { _id: '3' }];
    component.submit();

    expect(symptomsResponseService.submitResponse).not.toHaveBeenCalled();
  });

  it('should expose validation and display helpers for answers and vitals', () => {
    expect(component.formatAnswerValue(['Cough', 'Fatigue'])).toBe('Cough, Fatigue');
    expect(component.formatAnswerValue(true)).toBe('Yes');
    expect(component.formatAnswerValue('')).toBe('No answer provided');
    expect(component.getStatusColor({ label: 'Pain level', type: 'scale' }, 8)).toBe('text-red-500');
    expect(component.getStatusColor({ label: 'Temperature', type: 'number' }, 37.8)).toBe('text-amber-500');
    expect(component.getDisplayAnswer({ label: 'Heart rate', type: 'number' }, 88)).toBe('88 bpm');
  });

  it('should group submitted answers by question category', () => {
    const groups = component.getSubmissionGroups([
      { questionId: 'temperature', value: 37 },
      { questionId: 'pain', value: 5 },
    ]);

    expect(groups.map((group) => group.key)).toEqual(['vital_parameters', 'subjective_symptoms']);
    expect(groups[0].items[0].answer.value).toBe(37);
  });

  it('should select responses in chronological order', () => {
    component.todayResponses = [
      { _id: 'late', createdAt: '2026-04-17T12:00:00.000Z' },
      { _id: 'early', createdAt: '2026-04-17T08:00:00.000Z' },
    ];

    component.selectResponse(1);

    expect(component.selectedResponse?._id).toBe('late');
  });

  it('should surface an error when the submit request fails', () => {
    symptomsResponseService.submitResponse.and.returnValue(throwError(() => new Error('network')));
    component.getControl(component.questions.find((question) => question._id === 'temperature')!)?.setValue(37.4);
    component.getControl(component.questions.find((question) => question._id === 'pain')!)?.setValue(6);
    component.onMultipleChoiceToggleFor(component.questions.find((question) => question._id === 'symptoms')!, 'Fatigue');

    component.submit();

    expect(component.errorMessage).toBe('Error while submitting. Please try again.');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should navigate back to the patient dashboard', () => {
    component.goBack();

    expect(router.navigate).toHaveBeenCalledWith(['/patient/dashboard']);
  });
});
