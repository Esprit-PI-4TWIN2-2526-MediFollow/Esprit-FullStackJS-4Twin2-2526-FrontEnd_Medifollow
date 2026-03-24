import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { UsersService } from '../../../services/user/users.service';
import {
  SymptomsAssignedForm,
  SymptomsQuestion,
  SymptomsQuestionType,
} from './symptoms-response.model';
import { SymptomsResponseService } from './symptoms-response.service';

@Component({
  selector: 'app-symptoms-renderer',
  templateUrl: './symptoms-renderer.component.html',
  styleUrl: './symptoms-renderer.component.css',
})
export class SymptomsRendererComponent implements OnInit {
  form: SymptomsAssignedForm | null = null;
  responseForm: FormGroup;
  patientId = '';

  isLoading = true;
  isSubmitting = false;
  isSubmitted = false;
  hasSubmittedToday = false;
  errorMessage = '';
  submissionMessage = '';

  currentIndex = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usersService: UsersService,
    private symptomsResponseService: SymptomsResponseService
  ) {
    this.responseForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadPatientAndForm();
  }

  get currentQuestion(): SymptomsQuestion | null {
    return this.form?.questions?.[this.currentIndex] ?? null;
  }

  get totalQuestions(): number {
    return this.form?.questions?.length ?? 0;
  }

  get progressPercent(): number {
    if (!this.totalQuestions) return 0;
    return Math.round(((this.currentIndex + 1) / this.totalQuestions) * 100);
  }

  get isLastQuestion(): boolean {
    return this.currentIndex === this.totalQuestions - 1;
  }

  get isFirstQuestion(): boolean {
    return this.currentIndex === 0;
  }

  get currentQuestionControl(): AbstractControl | null {
    const question = this.currentQuestion;
    return question?._id ? this.responseForm.get(question._id) : null;
  }

  get scaleValues(): number[] {
    const question = this.currentQuestion;
    if (!question) return [];

    const min = question.validation?.min ?? 1;
    const max = question.validation?.max ?? 10;
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }

  canGoNext(): boolean {
    if (this.hasSubmittedToday) return false;

    const control = this.currentQuestionControl;
    if (!control) return false;

    return control.valid;
  }

  next(): void {
    const control = this.currentQuestionControl;
    control?.markAsTouched();

    if (!this.canGoNext()) return;
    if (!this.isLastQuestion) this.currentIndex++;
  }

  previous(): void {
    if (!this.isFirstQuestion) this.currentIndex--;
  }

  goBack(): void {
    this.router.navigate(['/patient/dashboard']);
  }

  submit(): void {
    if (this.hasSubmittedToday || !this.form?._id) return;

    const control = this.currentQuestionControl;
    control?.markAsTouched();

    if (!this.canGoNext()) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    this.symptomsResponseService.submitResponse({
      patientId: this.patientId,
      formId: this.form._id,
      answers: this.buildAnswersPayload(),
      date: new Date().toISOString(),
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
      },
      error: (error) => {
        console.error('Failed to submit symptoms response', error);
        this.errorMessage = 'Error while submitting. Please try again.';
        this.isSubmitting = false;
      },
    });
  }

  onScaleSelect(value: number): void {
    this.currentQuestionControl?.setValue(value);
    this.currentQuestionControl?.markAsTouched();
  }

  isScaleSelected(value: number): boolean {
    return this.currentQuestionControl?.value === value;
  }

  onSingleChoiceSelect(value: string | boolean): void {
    this.currentQuestionControl?.setValue(value);
    this.currentQuestionControl?.markAsTouched();
  }

  onMultipleChoiceToggle(optionIndex: number): void {
    const array = this.getCurrentMultipleChoiceArray();
    if (!array) return;

    const control = array.at(optionIndex) as FormControl<boolean>;
    control.setValue(!control.value);
    array.markAsTouched();
    array.updateValueAndValidity();
  }

  isOptionChecked(optionIndex: number): boolean {
    const array = this.getCurrentMultipleChoiceArray();
    return !!array?.at(optionIndex)?.value;
  }

  getSelectedOptionsCount(): number {
    const array = this.getCurrentMultipleChoiceArray();
    return array ? (array.value as boolean[]).filter(Boolean).length : 0;
  }

  isTouched(): boolean {
    const control = this.currentQuestionControl;
    return !!control && (control.touched || control.dirty);
  }

  getFieldError(): string {
    const question = this.currentQuestion;
    const control = this.currentQuestionControl;

    if (!question || !control || !control.errors || !this.isTouched()) {
      return '';
    }

    if (control.errors['required']) {
      switch (this.normalizeType(question.type)) {
        case 'single_choice':
        case 'select':
          return 'Please select an option.';
        case 'multiple_choice':
          return 'Please select at least one option.';
        case 'date':
          return 'Please select a date.';
        case 'boolean':
          return 'Please select Yes or No.';
        case 'scale':
          return 'Please select a value.';
        case 'number':
          return 'Please enter a valid number.';
        default:
          return 'This field cannot be empty.';
      }
    }

    if (control.errors['minlength']) {
      return 'Please enter at least 3 characters.';
    }

    if (control.errors['min']) {
      return `Value must be at least ${question.validation?.min}.`;
    }

    if (control.errors['max']) {
      return `Value must be at most ${question.validation?.max}.`;
    }

    if (control.errors['futureDate']) {
      return 'Date cannot be in the future.';
    }

    return '';
  }

  private loadPatientAndForm(): void {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
      this.errorMessage = 'Unable to identify the current patient.';
      this.isLoading = false;
      return;
    }

    try {
      const localUser = JSON.parse(userStr);

      this.usersService.getUserByEmail(localUser.email).subscribe({
        next: (user) => {
          this.patientId = user._id || '';

          if (!this.patientId) {
            this.errorMessage = 'Unable to identify the current patient.';
            this.isLoading = false;
            return;
          }

          forkJoin({
            todayResponse: this.symptomsResponseService.getTodayResponse(this.patientId),
            form: this.symptomsResponseService.getAssignedForm(this.patientId),
          }).subscribe({
            next: ({ todayResponse, form }) => {
              this.hasSubmittedToday = !!todayResponse;

              if (!form) {
                this.form = null;
                this.isLoading = false;
                return;
              }

              this.form = this.normalizeForm(form);
              this.buildForm();

              if (this.hasSubmittedToday) {
                this.submissionMessage = 'You have already submitted today\'s symptoms';
                this.responseForm.disable({ emitEvent: false });
              }

              this.isLoading = false;
            },
            error: (error) => {
              console.error('Failed to load symptoms form', error);
              this.errorMessage = 'Unable to load today\'s symptoms form.';
              this.isLoading = false;
            },
          });
        },
        error: (error) => {
          console.error('Error loading patient', error);
          this.errorMessage = 'Unable to identify the current patient.';
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Error parsing current user', error);
      this.errorMessage = 'Unable to identify the current patient.';
      this.isLoading = false;
    }
  }

  private buildForm(): void {
    const group: Record<string, AbstractControl> = {};

    for (const question of this.form?.questions ?? []) {
      if (!question._id) continue;
      group[question._id] = this.createControl(question);
    }

    this.responseForm = this.fb.group(group);
  }

  private createControl(question: SymptomsQuestion): AbstractControl {
    const type = this.normalizeType(question.type);
    const validators = [];

    if (question.required) {
      if (type === 'multiple_choice') {
        validators.push(this.requireAtLeastOneSelectionValidator);
      } else {
        validators.push(Validators.required);
      }
    }

    if (type === 'text') {
      validators.push(Validators.minLength(3));
    }

    if (type === 'number') {
      if (question.validation?.min !== undefined) {
        validators.push(Validators.min(question.validation.min));
      }
      if (question.validation?.max !== undefined) {
        validators.push(Validators.max(question.validation.max));
      }
    }

    if (type === 'date') {
      validators.push(this.noFutureDateValidator);
    }

    if (type === 'multiple_choice') {
      const optionControls = (question.options ?? []).map(() => this.fb.control(false));
      return this.fb.array(optionControls, validators);
    }

    return this.fb.control(this.getInitialValue(type), validators);
  }

  private buildAnswersPayload(): Record<string, unknown> {
    const answers: Record<string, unknown> = {};

    for (const question of this.form?.questions ?? []) {
      if (!question._id) continue;

      const control = this.responseForm.get(question._id);
      const type = this.normalizeType(question.type);

      if (!control) continue;

      if (type === 'multiple_choice') {
        const selected = (question.options ?? []).filter((_, index) => (control.value as boolean[])[index]);
        answers[question._id] = selected;
      } else {
        answers[question._id] = control.value;
      }
    }

    return answers;
  }

  private getCurrentMultipleChoiceArray(): FormArray | null {
    return this.currentQuestionControl instanceof FormArray ? this.currentQuestionControl : null;
  }

  private normalizeForm(form: SymptomsAssignedForm): SymptomsAssignedForm {
    return {
      ...form,
      questions: [...(form.questions ?? [])]
        .map((question) => ({
          ...question,
          type: this.normalizeType(question.type),
        }))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    };
  }

  private normalizeType(type: SymptomsQuestionType | string | undefined): SymptomsQuestionType {
    switch (type) {
      case 'text':
      case 'number':
      case 'single_choice':
      case 'multiple_choice':
      case 'select':
      case 'date':
      case 'boolean':
      case 'scale':
        return type;
      case 'yes_no':
        return 'boolean';
      default:
        return 'text';
    }
  }

  private getInitialValue(type: SymptomsQuestionType): string | number | boolean | null {
    switch (type) {
      case 'number':
      case 'scale':
      case 'boolean':
        return null;
      default:
        return '';
    }
  }

  private requireAtLeastOneSelectionValidator(control: AbstractControl): { required: true } | null {
    const value = control.value as boolean[] | null;
    return Array.isArray(value) && value.some(Boolean) ? null : { required: true };
  }

  private noFutureDateValidator(control: AbstractControl): { futureDate: true } | null {
    if (!control.value) return null;

    const selectedDate = new Date(control.value);
    if (Number.isNaN(selectedDate.getTime())) {
      return { futureDate: true };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate > today ? { futureDate: true } : null;
  }
}
