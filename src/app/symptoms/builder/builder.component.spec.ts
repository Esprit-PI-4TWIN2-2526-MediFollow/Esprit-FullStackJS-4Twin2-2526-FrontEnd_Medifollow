import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { BuilderComponent } from './builder.component';
import { SymptomForm, SymptomService } from '../services/symptom.service';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import { Service, ServiceManagementService } from '../../services/service/service-management.service';

describe('BuilderComponent', () => {
  let component: BuilderComponent;
  let fixture: ComponentFixture<BuilderComponent>;
  let symptomService: jasmine.SpyObj<SymptomService>;
  let usersService: jasmine.SpyObj<UsersService>;
  let serviceManagementService: jasmine.SpyObj<ServiceManagementService>;
  let router: Router;
  let routeId: string | null;

  const patient = {
    _id: 'patient-1',
    firstName: 'Jane',
    lastName: 'Patient',
    email: 'jane@example.com',
    role: 'patient',
  } as Users;

  const physician = {
    _id: 'doctor-1',
    firstName: 'John',
    lastName: 'Doctor',
    email: 'doctor@example.com',
    role: 'doctor',
  } as Users;

  const activeService = {
    _id: 'service-1',
    nom: 'Cardiology',
    statut: 'ACTIF',
  } as Service;

  const inactiveService = {
    _id: 'service-2',
    nom: 'Radiology',
    statut: 'INACTIF',
  } as Service;

  beforeEach(async () => {
    routeId = null;
    symptomService = jasmine.createSpyObj<SymptomService>('SymptomService', [
      'createForm',
      'updateForm',
      'getForms',
      'getFormById',
      'generateQuestionsWithAI',
    ]);
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['getUsers']);
    serviceManagementService = jasmine.createSpyObj<ServiceManagementService>(
      'ServiceManagementService',
      ['getAll']
    );

    symptomService.getForms.and.returnValue(of([]));
    symptomService.createForm.and.returnValue(of({ _id: 'form-1', title: 'Saved', questions: [] }));
    symptomService.updateForm.and.returnValue(of({ _id: 'form-1', title: 'Updated', questions: [] }));
    symptomService.getFormById.and.returnValue(of({ _id: 'form-1', title: 'Loaded', questions: [] }));
    symptomService.generateQuestionsWithAI.and.returnValue(of({ questions: [] }));
    usersService.getUsers.and.returnValue(of([patient, physician]));
    serviceManagementService.getAll.and.returnValue(of([activeService, inactiveService]));

    await TestBed.configureTestingModule({
      declarations: [BuilderComponent],
      imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: SymptomService, useValue: symptomService },
        { provide: UsersService, useValue: usersService },
        { provide: ServiceManagementService, useValue: serviceManagementService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => routeId,
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(console, 'error');

    fixture = TestBed.createComponent(BuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and initialize default symptoms questions', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBeFalse();
    expect(component.questions.length).toBe(9);
    expect(component.questions[0].order).toBe(0);
    expect(component.questions.every((question, index) => question.order === index)).toBeTrue();
  });

  it('should load only patients and active departments', () => {
    expect(component.patients).toEqual([patient]);
    expect(component.medicalServices).toEqual(['Cardiology']);
  });

  it('should validate title, patient, service and question options', () => {
    component.title = 'OK';
    component.medicalService = '';
    component.selectedPatients = [];

    expect(component.isTitleValid).toBeFalse();
    expect(component.isMedicalServiceValid).toBeFalse();
    expect(component.isPatientValid).toBeFalse();

    component.title = 'Daily symptoms form';
    component.medicalService = 'Cardiology';
    component.selectedPatients = ['patient-1'];
    component.addQuestion();
    const addedIndex = component.questions.length - 1;
    component.onTypeChange(addedIndex, 'single_choice');
    component.updateOption(addedIndex, 0, 'Yes');
    component.updateOption(addedIndex, 1, '');

    expect(component.hasEnoughOptions(addedIndex)).toBeFalse();
    expect(component.isFormValid()).toBeFalse();
  });

  it('should add, remove and re-order questions', () => {
    const initialLength = component.questions.length;

    component.currentStep = 1;
    component.addQuestion();

    expect(component.questions.length).toBe(initialLength + 1);
    expect(component.questions.at(-1)?.category).toBe('subjective_symptoms');
    expect(component.questions.at(-1)?.order).toBe(initialLength);

    component.removeQuestion(component.questions.length - 1);

    expect(component.questions.length).toBe(initialLength);
    expect(component.questions.every((question, index) => question.order === index)).toBeTrue();
  });

  it('should switch question options when the type changes', () => {
    component.onTypeChange(0, 'multiple_choice');

    expect(component.questions[0].type).toBe('multiple_choice');
    expect(component.questions[0].options).toEqual(['Option 1', 'Option 2']);

    component.onTypeChange(0, 'number');

    expect(component.questions[0].type).toBe('number');
    expect(component.questions[0].options).toEqual([]);
  });

  it('should track selected patients and block patients already assigned to another form', () => {
    component.patientsWithForm = ['patient-1', 'patient-2'];

    component.togglePatient('patient-1');
    expect(component.selectedPatients).toEqual([]);

    component.patientsWithForm = [];
    component.togglePatient('patient-1');
    expect(component.selectedPatients).toEqual(['patient-1']);

    component.togglePatient('patient-1');
    expect(component.selectedPatients).toEqual([]);
  });

  it('should normalize generated AI questions before appending them', () => {
    component.title = 'Post-op monitoring';
    component.medicalService = 'Cardiology';
    component.currentStep = 1;
    symptomService.generateQuestionsWithAI.and.returnValue(of({
      questions: [
        { label: ' Pain level ', type: 'rating' },
        { label: 'Symptoms', type: 'multiple', options: [' Cough ', '', 'Fatigue'] },
      ],
    }));

    component.generateWithAI();

    const generatedQuestions = component.questions.slice(-2);
    expect(symptomService.generateQuestionsWithAI).toHaveBeenCalledWith(
      'Post-op monitoring',
      '',
      5,
      'subjective_symptoms'
    );
    expect(generatedQuestions[0]).toEqual(jasmine.objectContaining({
      label: 'Pain level',
      type: 'scale',
      category: 'subjective_symptoms',
      required: true,
    }));
    expect(generatedQuestions[1]).toEqual(jasmine.objectContaining({
      label: 'Symptoms',
      type: 'multiple_choice',
      options: ['Cough', 'Fatigue'],
      category: 'subjective_symptoms',
    }));
    expect(component.isGenerating).toBeFalse();
  });

  it('should show an AI generation error when required context is missing or the request fails', () => {
    component.title = '';
    component.medicalService = '';

    component.generateWithAI();
    expect(component.generateError).toBe('Please fill in the title and medical service first.');

    component.title = 'Daily form';
    component.medicalService = 'Cardiology';
    symptomService.generateQuestionsWithAI.and.returnValue(throwError(() => new Error('AI down')));

    component.generateWithAI();

    expect(component.generateError).toBe('Failed to generate questions. Please try again.');
    expect(component.isGenerating).toBeFalse();
  });

  it('should create a symptoms form with trimmed values and selected patients', () => {
    component.title = '  Daily symptoms form  ';
    component.description = '  Follow pain and vitals  ';
    component.medicalService = 'Cardiology';
    component.selectedPatients = ['patient-1'];

    component.submit();

    expect(symptomService.createForm).toHaveBeenCalled();
    const payload = symptomService.createForm.calls.mostRecent().args[0] as SymptomForm & { patientIds: string[] };
    expect(payload.title).toBe('Daily symptoms form');
    expect(payload.description).toBe('Follow pain and vitals');
    expect(payload.medicalService).toBe('Cardiology');
    expect(payload.patientIds).toEqual(['patient-1']);
    expect(payload.questions.length).toBe(9);
    expect(router.navigate).toHaveBeenCalledWith(['/symptoms']);
  });

  it('should not submit when the form is invalid', () => {
    component.title = '';
    component.medicalService = 'Cardiology';
    component.selectedPatients = ['patient-1'];

    component.submit();

    expect(component.submitted).toBeTrue();
    expect(symptomService.createForm).not.toHaveBeenCalled();
  });

  it('should surface a save error when the create request fails', () => {
    symptomService.createForm.and.returnValue(throwError(() => new Error('save failed')));
    component.title = 'Daily symptoms form';
    component.medicalService = 'Cardiology';
    component.selectedPatients = ['patient-1'];

    component.submit();

    expect(component.errorMessage).toBe('Unable to create the form. Please try again.');
    expect(component.isSubmitting).toBeFalse();
  });
});
