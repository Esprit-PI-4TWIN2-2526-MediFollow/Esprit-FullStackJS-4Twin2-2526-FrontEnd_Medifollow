import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import {
  SymptomForm,
  SymptomQuestion,
  SymptomQuestionTodayStatus,
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
  visibleQuestions: SymptomQuestion[] = [];
  responseForm!: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  questionStatuses: SymptomQuestionTodayStatus[] = [];
  private questionStatusById = new Map<string, SymptomQuestionTodayStatus>();
  private statusPatientId = '';

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
    if (!this.symptomForm || this.visibleQuestions.length === 0 || this.responseForm.invalid || this.isSubmitting) {
      this.responseForm.markAllAsTouched();
      return;
    }

    if (this.visibleQuestions.some((question) => !question._id)) {
      this.errorMessage = 'Unable to submit this form because some questions are missing IDs.';
      return;
    }

    const payload: SymptomResponsePayload = {
      formId: this.symptomForm._id ?? this.symptomFormId,
      answers: this.visibleQuestions.map((question, index) => ({
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
        this.refreshTodayQuestionStatus();
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

  getQuestionStatus(question: SymptomQuestion): SymptomQuestionTodayStatus | undefined {
    return question._id ? this.questionStatusById.get(question._id) : undefined;
  }

  isQuestionRequired(question: SymptomQuestion): boolean {
    const status = this.getQuestionStatus(question);

    if (status?.required !== undefined) {
      return status.required;
    }

    if (status?.isRequired !== undefined) {
      return status.isRequired;
    }

    return !!question.required;
  }

  isQuestionBlocked(question: SymptomQuestion): boolean {
    return this.getQuestionStatus(question)?.isBlocked === true;
  }

  getMeasurementProgress(question: SymptomQuestion): string {
    const completed = this.getCompletedOccurrences(question);
    const total = this.getOccurrencesPerDay(question);
    const current = this.getCurrentOccurrence(question, completed, total);

    return `Measurement ${current} / ${total}`;
  }

  getOccurrenceSummary(question: SymptomQuestion): string {
    return `Required ${this.getOccurrencesPerDay(question)} per day`;
  }

  private loadForm(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.symptomService.getFormById(id).pipe(
      switchMap((form) => {
        const patientId = this.getPatientIdForQuestionStatus(form);
        if (!patientId) {
          return throwError(() => new Error('Missing patient id for symptoms question status'));
        }

        this.statusPatientId = patientId;
        return forkJoin({
          form: of(form),
          statuses: this.symptomService.getTodayQuestionStatus(patientId),
        });
      })
    ).subscribe({
      next: ({ form, statuses }) => {
        this.symptomForm = form;
        this.applyTodayQuestionStatus(statuses);
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
    if (!this.isQuestionRequired(question)) {
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

  private applyTodayQuestionStatus(statuses: SymptomQuestionTodayStatus[]): void {
    this.questionStatuses = statuses;
    this.questionStatusById = new Map(
      statuses
        .map((status): [string, SymptomQuestionTodayStatus] | null => {
          const questionId = this.getStatusQuestionId(status);
          return questionId ? [questionId, status] : null;
        })
        .filter((entry): entry is [string, SymptomQuestionTodayStatus] => entry !== null)
    );

    this.visibleQuestions = (this.symptomForm?.questions ?? []).filter((question) => !this.isQuestionBlocked(question));
    this.buildResponseForm(this.visibleQuestions);
  }

  private refreshTodayQuestionStatus(): void {
    if (!this.statusPatientId || !this.symptomForm) {
      return;
    }

    this.symptomService.getTodayQuestionStatus(this.statusPatientId).subscribe({
      next: (statuses) => this.applyTodayQuestionStatus(statuses),
      error: (error) => {
        console.error('Failed to refresh symptoms question status', error);
        this.buildResponseForm(this.visibleQuestions);
      },
    });
  }

  private getStatusQuestionId(status: SymptomQuestionTodayStatus): string | null {
    if (typeof status.questionId === 'string' && status.questionId.trim()) {
      return status.questionId;
    }

    if (typeof status.question === 'string' && status.question.trim()) {
      return status.question;
    }

    if (typeof status.question === 'object' && typeof status.question._id === 'string' && status.question._id.trim()) {
      return status.question._id;
    }

    return null;
  }

  private getOccurrencesPerDay(question: SymptomQuestion): number {
    const status = this.getQuestionStatus(question);
    return this.normalizePositiveCount(status?.occurrencesPerDay ?? question.occurrencesPerDay, 1);
  }

  private getCompletedOccurrences(question: SymptomQuestion): number {
    const status = this.getQuestionStatus(question);
    const remainingRequired = this.normalizeNonNegativeCount(status?.remainingRequired, -1);
    if (remainingRequired >= 0) {
      if (remainingRequired > 0) {
        return Math.max(this.getOccurrencesPerDay(question) - remainingRequired, 0);
      }

      return this.getOccurrencesPerDay(question);
    }

    return this.normalizeNonNegativeCount(status?.occurrencesToday ?? status?.completedOccurrences, 0);
  }

  private getCurrentOccurrence(question: SymptomQuestion, completed: number, total: number): number {
    const status = this.getQuestionStatus(question);
    const current = this.normalizePositiveCount(status?.currentOccurrence, completed + 1);
    return Math.min(Math.max(current, 1), total);
  }

  private normalizePositiveCount(value: number | undefined, fallback: number): number {
    const count = Number(value);
    return Number.isInteger(count) && count > 0 ? count : fallback;
  }

  private normalizeNonNegativeCount(value: number | undefined, fallback: number): number {
    const count = Number(value);
    return Number.isInteger(count) && count >= 0 ? count : fallback;
  }

  private getPatientIdForQuestionStatus(form: SymptomForm): string {
    const currentUserId = this.getCurrentPatientUserId();
    if (currentUserId) {
      return currentUserId;
    }

    if (typeof form.patientId === 'string' && form.patientId.trim()) {
      return form.patientId.trim();
    }

    const patientId = form.patientIds?.find((id) => typeof id === 'string' && id.trim());
    return patientId?.trim() ?? '';
  }

  private getCurrentPatientUserId(): string {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        return '';
      }

      const user = JSON.parse(rawUser) as { _id?: unknown; role?: unknown };
      const role = this.getRoleName(user).toLowerCase();
      return role === 'patient' && typeof user._id === 'string' ? user._id.trim() : '';
    } catch {
      return '';
    }
  }

  private getRoleName(user: { role?: unknown }): string {
    if (typeof user.role === 'string') {
      return user.role;
    }

    if (user.role && typeof user.role === 'object' && 'name' in user.role) {
      const role = user.role as { name?: unknown };
      return typeof role.name === 'string' ? role.name : '';
    }

    return '';
  }
}
