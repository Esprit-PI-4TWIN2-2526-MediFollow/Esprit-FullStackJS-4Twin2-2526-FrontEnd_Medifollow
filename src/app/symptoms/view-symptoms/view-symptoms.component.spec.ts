import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';

import { ViewSymptomsComponent } from './view-symptoms.component';
import { SymptomForm, SymptomService } from '../services/symptom.service';

describe('ViewSymptomsComponent', () => {
  let component: ViewSymptomsComponent;
  let fixture: ComponentFixture<ViewSymptomsComponent>;
  let symptomService: jasmine.SpyObj<SymptomService>;
  let router: Router;
  let routeId: string | null;

  const symptomForm: SymptomForm = {
    _id: 'form-1',
    title: 'Daily symptoms',
    medicalService: 'Cardiology',
    questions: [
      { _id: 'question-1', label: 'Temperature', type: 'number', required: true },
      { _id: 'question-2', label: 'Changed dressing', type: 'boolean', required: true },
      {
        _id: 'question-3',
        label: 'Symptoms',
        type: 'multiple_choice',
        required: true,
        options: ['Nausea', 'Fatigue', ''],
      },
      { _id: 'question-4', label: 'Comment', type: 'text', required: false },
    ],
  };

  beforeEach(async () => {
    routeId = 'form-1';
    symptomService = jasmine.createSpyObj<SymptomService>('SymptomService', [
      'getFormById',
      'submitResponse',
    ]);
    symptomService.getFormById.and.returnValue(of(symptomForm));
    symptomService.submitResponse.and.returnValue(of({ saved: true }));

    await TestBed.configureTestingModule({
      declarations: [ViewSymptomsComponent],
      imports: [CommonModule, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: SymptomService, useValue: symptomService },
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
    spyOn(Swal, 'fire').and.resolveTo({} as any);
    spyOn(console, 'error');

    fixture = TestBed.createComponent(ViewSymptomsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the selected symptoms form', () => {
    expect(component).toBeTruthy();
    expect(symptomService.getFormById).toHaveBeenCalledWith('form-1');
    expect(component.symptomForm).toEqual(symptomForm);
    expect(component.isLoading).toBeFalse();
  });

  it('should build response controls with required validation', () => {
    expect(component.responseForm.contains('question_0')).toBeTrue();
    expect(component.responseForm.contains('question_1')).toBeTrue();
    expect(component.responseForm.contains('question_2')).toBeTrue();
    expect(component.responseForm.contains('question_3')).toBeTrue();

    expect(component.responseForm.get('question_0')?.valid).toBeFalse();
    expect(component.responseForm.get('question_2')?.valid).toBeFalse();
    expect(component.responseForm.get('question_3')?.valid).toBeTrue();
  });

  it('should toggle multiple choice answers without duplicates', () => {
    component.toggleMultipleChoice(2, 'Nausea', true);
    component.toggleMultipleChoice(2, 'Nausea', true);
    component.toggleMultipleChoice(2, 'Fatigue', true);

    expect(component.responseForm.get('question_2')?.value).toEqual(['Nausea', 'Fatigue']);
    expect(component.isMultipleChoiceSelected(2, 'Fatigue')).toBeTrue();

    component.toggleMultipleChoice(2, 'Nausea', false);

    expect(component.responseForm.get('question_2')?.value).toEqual(['Fatigue']);
    expect(component.isMultipleChoiceSelected(2, 'Nausea')).toBeFalse();
  });

  it('should submit normalized answers and reset the form on success', () => {
    component.responseForm.get('question_0')?.setValue('38.2');
    component.selectBooleanValue(1, true);
    component.responseForm.get('question_2')?.setValue(['Nausea', '']);
    component.responseForm.get('question_3')?.setValue('');

    component.submit();

    expect(symptomService.submitResponse).toHaveBeenCalledWith({
      formId: 'form-1',
      answers: [
        { questionId: 'question-1', value: 38.2 },
        { questionId: 'question-2', value: true },
        { questionId: 'question-3', value: ['Nausea'] },
        { questionId: 'question-4', value: null },
      ],
    });
    expect(component.isSubmitting).toBeFalse();
    expect(component.responseForm.get('question_0')?.value).toBe('');
  });

  it('should not submit when a question id is missing', () => {
    component.symptomForm = {
      ...symptomForm,
      questions: [{ label: 'Question without id', type: 'text', required: false }],
    };
    component.responseForm = component['fb'].group({ question_0: ['ok'] });

    component.submit();

    expect(symptomService.submitResponse).not.toHaveBeenCalled();
    expect(component.errorMessage).toBe('Unable to submit this form because some questions are missing IDs.');
  });

  it('should expose a submit error from the backend', () => {
    symptomService.submitResponse.and.returnValue(
      throwError(() => ({ error: { message: 'Already submitted today' } }))
    );
    component.responseForm.get('question_0')?.setValue(37);
    component.selectBooleanValue(1, true);
    component.responseForm.get('question_2')?.setValue(['Fatigue']);

    component.submit();

    expect(component.errorMessage).toBe('Already submitted today');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should navigate back and to edit screen', () => {
    component.goBack();
    component.goToEdit();

    expect(router.navigate).toHaveBeenCalledWith(['/symptoms']);
    expect(router.navigate).toHaveBeenCalledWith(['/symptoms/builder', 'form-1']);
  });

  it('should show a load error when the form cannot be fetched', () => {
    symptomService.getFormById.and.returnValue(throwError(() => new Error('not found')));

    component['loadForm']('form-1');

    expect(component.errorMessage).toBe('Unable to load the selected symptoms form.');
    expect(component.isLoading).toBeFalse();
  });
});
