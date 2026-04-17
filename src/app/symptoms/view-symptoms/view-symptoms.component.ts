import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import {
  SymptomForm,
  SymptomQuestion,
  SymptomQuestionType,
  SymptomResponsePayload,
  SymptomService,
} from '../services/symptom.service';

type ResponseValue = string | number | boolean | string[] | null;

@Component({
  selector: 'app-view-symptoms',
  templateUrl: './view-symptoms.component.html',
  styleUrl: './view-symptoms.component.css',
})
export class ViewSymptomsComponent implements OnInit {
  symptomFormId = '';
  symptomForm: SymptomForm | null = null;
  responseForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
    private readonly symptomService: SymptomService
  ) {
    this.responseForm = this.fb.group({});
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Unable to load the selected symptoms form.';
      this.isLoading = false;
      return;
    }

    this.symptomFormId = id;
    this.loadForm(id);
  }

  goBack(): void {
    this.router.navigate(['/symptoms']);
  }

  goToEdit(): void {
    if (!this.symptomFormId) {
      return;
    }

    this.router.navigate(['/symptoms/builder', this.symptomFormId]);
  }

  submit(): void {
    if (!this.symptomForm || this.responseForm.invalid || this.isSubmitting) {
      this.responseForm.markAllAsTouched();
      return;
    }

    if (this.symptomForm.questions.some((question) => !question._id)) {
      this.errorMessage = 'Unable to submit this form because some questions are missing IDs.';
      return;
    }

    const payload: SymptomResponsePayload = {
      formId: this.symptomForm._id ?? this.symptomFormId,
      answers: this.symptomForm.questions.map((question, index) => ({
        questionId: question._id!,
        value: this.normalizeAnswerValue(question, this.responseForm.get(this.getControlName(index))?.value),
      })),
    };

    this.isSubmitting = true;
    this.symptomService.submitResponse(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Response submitted',
          text: 'The symptoms form was submitted successfully.',
          confirmButtonColor: '#12B0B9',
        });
        this.buildResponseForm(this.symptomForm?.questions ?? []);
      },
      error: (error) => {
        console.error('Symptoms submit error:', error);
        this.isSubmitting = false;
        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to submit the symptoms response.';
      },
    });
  }

  getControlName(index: number): string {
    return `question_${index}`;
  }

  isChoiceQuestion(type: SymptomQuestionType): boolean {
    return type === 'single_choice' || type === 'multiple_choice';
  }

  toggleMultipleChoice(index: number, option: string, checked: boolean): void {
    const control = this.responseForm.get(this.getControlName(index));
    const currentValue = Array.isArray(control?.value) ? [...control.value] : [];

    const nextValue = checked
      ? Array.from(new Set([...currentValue, option]))
      : currentValue.filter((item: string) => item !== option);

    control?.setValue(nextValue);
    control?.markAsTouched();
  }

  isMultipleChoiceSelected(index: number, option: string): boolean {
    const value = this.responseForm.get(this.getControlName(index))?.value;
    return Array.isArray(value) && value.includes(option);
  }

  selectScaleValue(questionIndex: number, value: number): void {
    const control = this.responseForm.get(this.getControlName(questionIndex));
    control?.setValue(value);
    control?.markAsTouched();
  }

  selectBooleanValue(questionIndex: number, value: boolean): void {
    const control = this.responseForm.get(this.getControlName(questionIndex));
    control?.setValue(value);
    control?.markAsTouched();
  }

  getAnswerValue(questionId: string | undefined, questionIndex: number): ResponseValue {
    if (!questionId) {
      return null;
    }

    return this.responseForm.get(this.getControlName(questionIndex))?.value ?? null;
  }

  private loadForm(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.symptomService.getFormById(id).subscribe({
      next: (form) => {
        this.symptomForm = form;
        this.buildResponseForm(form.questions);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load the selected symptoms form.';
        this.isLoading = false;
      },
    });
  }

  private buildResponseForm(questions: SymptomQuestion[]): void {
    const controls: Record<string, FormControl> = {};

    questions.forEach((question, index) => {
      const controlName = this.getControlName(index);
      const initialValue = question.type === 'multiple_choice' ? [] : question.type === 'boolean' ? null : '';

      controls[controlName] = this.fb.control(initialValue, this.getValidators(question));
    });

    this.responseForm = this.fb.group(controls);
  }

  private getValidators(question: SymptomQuestion): ValidatorFn[] {
    if (!question.required) {
      return [];
    }

    if (question.type === 'multiple_choice') {
      return [
        (control: AbstractControl) =>
          Array.isArray(control.value) && control.value.length > 0 ? null : { required: true },
      ];
    }

    return [Validators.required];
  }

  private normalizeAnswerValue(question: SymptomQuestion, value: ResponseValue): ResponseValue {
    if (question.type === 'number' && value !== null && value !== '') {
      return Number(value);
    }

    if (question.type === 'boolean') {
      if (value === 'true') {
        return true;
      }

      if (value === 'false') {
        return false;
      }
    }

    if (question.type === 'multiple_choice') {
      return Array.isArray(value) ? value.filter((item) => item.trim() !== '') : [];
    }

    return value === '' ? null : value;
  }
}
