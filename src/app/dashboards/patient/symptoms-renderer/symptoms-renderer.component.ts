import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { UsersService } from '../../../services/user/users.service';
import {
  SymptomsAssignedForm,
  SymptomsQuestion,
  SymptomsQuestionType,
  SymptomsSubmitAnswer,
  SymptomsTodayResponse,
} from './symptoms-response.model';
import { SymptomsResponseService } from './symptoms-response.service';

@Component({
  selector: 'app-symptoms-renderer',
  templateUrl: './symptoms-renderer.component.html',
  styleUrl: './symptoms-renderer.component.css',
})
export class SymptomsRendererComponent implements OnInit {
  currentUser: { _id: string } | null = null;
  form: SymptomsAssignedForm | null = null;
  responseForm: FormGroup;
  patientId = '';

  isLoading = true;
  isSubmitting = false;
  isSubmitted = false;
  hasSubmittedToday = false;
  errorMessage = '';
  submissionMessage = '';
  noData = false;

  historyDate = '';
  historyLabel = '';
  responses: SymptomsTodayResponse[] = [];
  todayResponses: SymptomsTodayResponse[] = [];
  selectedResponse: SymptomsTodayResponse | null = null;

  currentIndex = 0;
  currentStep = 0;

  readonly steps = [
    { key: 'vital_parameters', label: 'Vital' },
    { key: 'subjective_symptoms', label: 'Symptoms' },
    { key: 'patient_context', label: 'Context' },
    { key: 'clinical_data', label: 'Clinical' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private symptomsResponseService: SymptomsResponseService
  ) {
    this.responseForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.historyDate = params.get('date') || '';
      this.historyLabel = this.historyDate ? this.formatHistoryDate(this.historyDate) : '';
      this.loadPatientAndForm();
    });
  }

  get isHistoryMode(): boolean {
    return this.historyDate.trim() !== '';
  }

  get hasReachedDailyLimit(): boolean {
    return this.todayResponses.length >= 3;
  }

  get activeResponses(): SymptomsTodayResponse[] {
    return this.isHistoryMode ? this.responses : this.todayResponses;
  }

  get orderedResponses(): SymptomsTodayResponse[] {
    return [...this.activeResponses].sort((a, b) => {
      return this.getResponseTimestamp(a) - this.getResponseTimestamp(b);
    });
  }

  get selectedResponseAnswers(): SymptomsSubmitAnswer[] {
    return this.normalizeAnswers(this.selectedResponse?.answers);
  }

  get currentQuestion(): SymptomsQuestion | null {
    return this.form?.questions?.[this.currentIndex] ?? null;
  }

  get questions(): SymptomsQuestion[] {
    return this.form?.questions ?? [];
  }

  get formData(): SymptomsAssignedForm | null {
    return this.form;
  }

  get formGroup(): FormGroup {
    return this.responseForm;
  }

  get totalQuestions(): number {
    return this.questions.length;
  }

  get currentStepCategory(): string {
    return this.steps[this.currentStep].key;
  }

  get currentQuestions(): SymptomsQuestion[] {
    return this.questions.filter((question) => this.getQuestionCategory(question) === this.currentStepCategory);
  }

  get answeredQuestions(): number {
    return this.questions.filter((question) => this.isQuestionAnswered(question)).length;
  }

  get progressPercent(): number {
    if (!this.totalQuestions) return 0;
    return Math.round((this.answeredQuestions / this.totalQuestions) * 100);
  }

  get stepProgress(): { answered: number; total: number } {
    const stepQuestions = this.currentQuestions;
    const answered = stepQuestions.filter((question) => this.isQuestionAnswered(question)).length;

    return {
      answered,
      total: stepQuestions.length,
    };
  }

  get stepProgressPercent(): number {
    if (!this.stepProgress.total) return 0;
    return Math.round((this.stepProgress.answered / this.stepProgress.total) * 100);
  }

  get currentQuestionControl(): AbstractControl | null {
    const question = this.currentQuestion;
    return question?._id ? this.responseForm.get(question._id) : null;
  }

  get currentQuestionFormControl(): FormControl {
    const control = this.currentQuestionControl;

    if (!(control instanceof FormControl)) {
      throw new Error('The current question is not bound to a FormControl.');
    }

    return control;
  }

  get scaleValues(): number[] {
    const question = this.currentQuestion;
    if (!question) return [];

    const min = question.validation?.min ?? 1;
    const max = question.validation?.max ?? 10;
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }

  canGoNext(): boolean {
    if (this.hasReachedDailyLimit || this.isHistoryMode) return false;
    const questions = this.currentQuestions;
    if (questions.length === 0) return true;
    return questions.every((question) => this.getControl(question)?.valid);
  }

  next(): void {
    this.markCurrentStepTouched();
    if (!this.canGoNext()) return;
    this.nextStep();
  }

  previous(): void {
    this.prevStep();
  }

  nextStep(): void {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goBack(): void {
    this.router.navigate([this.isHistoryMode ? '/patient/dashboard' : '/patient/dashboard']);
  }

  goToDay(date: string): void {
    this.router.navigate(['/patient/symptoms-history', date]);
  }

  submit(): void {
    if (this.hasReachedDailyLimit || this.isHistoryMode) return;

    this.markAllTouched();

    if (this.responseForm.invalid) {
      return;
    }

    if (!this.currentUser?._id) {
      this.errorMessage = 'Unable to identify the current patient.';
      return;
    }

    if (!this.formData?._id) {
      this.errorMessage = 'Unable to identify the symptoms form.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const answers = this.buildAnswersPayload();
    if (answers.length === 0) {
      this.errorMessage = 'No valid answers to submit.';
      this.isSubmitting = false;
      return;
    }

    this.symptomsResponseService.submitResponse({
      patientId: this.currentUser._id,
      formId: this.formData._id,
      answers,
      date: new Date(),
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted = true;
        this.loadTodayResponses();
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

  onMultipleChoiceToggle(option: number | string): void {
    const array = this.getCurrentMultipleChoiceArray();
    if (!array) return;

    const optionIndex = typeof option === 'number'
      ? option
      : (this.currentQuestion?.options ?? []).indexOf(option);

    if (optionIndex < 0) return;

    const control = array.at(optionIndex) as FormControl<boolean>;
    control.setValue(!control.value);
    array.markAsTouched();
    array.updateValueAndValidity();
  }

  isOptionChecked(option: number | string): boolean {
    const array = this.getCurrentMultipleChoiceArray();
    const optionIndex = typeof option === 'number'
      ? option
      : (this.currentQuestion?.options ?? []).indexOf(option);

    if (optionIndex < 0) return false;

    return !!array?.at(optionIndex)?.value;
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

  getQuestionLabel(questionId: string): string {
    const question = this.form?.questions?.find((item) => item._id === questionId);
    return question?.label || questionId;
  }

  formatAnswerValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : 'No answer provided';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    if (value === null || value === undefined || value === '') {
      return 'No answer provided';
    }

    return String(value);
  }

  selectResponse(index: number): void {
    const response = this.orderedResponses[index];
    this.selectedResponse = response || null;
  }

  getAttemptLabel(index: number): string {
    return `Attempt ${index + 1}`;
  }

  getResponseTime(response: SymptomsTodayResponse): string {
    const timestamp = this.getResponseTimestamp(response);
    if (!timestamp) {
      return '';
    }

    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  getControl(question: SymptomsQuestion): AbstractControl | null {
    return question._id ? this.formGroup.get(question._id) : null;
  }

  getFormControl(question: SymptomsQuestion): FormControl {
    const control = this.getControl(question);
    if (!(control instanceof FormControl)) {
      throw new Error(`Question ${question._id || question.label} is not bound to a FormControl.`);
    }
    return control;
  }

  getMultipleChoiceArray(question: SymptomsQuestion): FormArray | null {
    const control = this.getControl(question);
    return control instanceof FormArray ? control : null;
  }

  getScaleValues(question: SymptomsQuestion): number[] {
    const min = question.validation?.min ?? 1;
    const max = question.validation?.max ?? 10;
    return Array.from({ length: max - min + 1 }, (_, index) => min + index);
  }

  onScaleSelectFor(question: SymptomsQuestion, value: number): void {
    this.getControl(question)?.setValue(value);
    this.getControl(question)?.markAsTouched();
  }

  isScaleSelectedFor(question: SymptomsQuestion, value: number): boolean {
    return this.getControl(question)?.value === value;
  }

  onSingleChoiceSelectFor(question: SymptomsQuestion, value: string | boolean): void {
    this.getControl(question)?.setValue(value);
    this.getControl(question)?.markAsTouched();
  }

  onMultipleChoiceToggleFor(question: SymptomsQuestion, option: number | string): void {
    const array = this.getMultipleChoiceArray(question);
    if (!array) return;

    const optionIndex = typeof option === 'number'
      ? option
      : (question.options ?? []).indexOf(option);

    if (optionIndex < 0) return;

    const control = array.at(optionIndex) as FormControl<boolean>;
    control.setValue(!control.value);
    array.markAsTouched();
    array.updateValueAndValidity();
  }

  isOptionCheckedFor(question: SymptomsQuestion, option: number | string): boolean {
    const array = this.getMultipleChoiceArray(question);
    const optionIndex = typeof option === 'number'
      ? option
      : (question.options ?? []).indexOf(option);

    if (optionIndex < 0) return false;

    return !!array?.at(optionIndex)?.value;
  }

  isTouchedFor(question: SymptomsQuestion): boolean {
    const control = this.getControl(question);
    return !!control && (control.touched || control.dirty);
  }

  getFieldErrorFor(question: SymptomsQuestion): string {
    const control = this.getControl(question);

    if (!control || !control.errors || !this.isTouchedFor(question)) {
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
    this.resetState();

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
          this.currentUser = this.patientId ? { _id: this.patientId } : null;

          if (!this.patientId) {
            this.errorMessage = 'Unable to identify the current patient.';
            this.isLoading = false;
            return;
          }

          this.loadTodayResponses();

          forkJoin({
            form: this.symptomsResponseService.getAssignedForm(this.patientId),
          }).subscribe({
            next: ({ form }) => {
              this.hasSubmittedToday = this.todayResponses.length > 0;
              this.form = form ? this.normalizeForm(form) : null;

              if (this.isHistoryMode) {
                this.loadSymptomsForDate(this.historyDate);
                return;
              }

              if (!this.form) {
                this.isLoading = false;
                return;
              }

              this.buildForm();

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

  private loadTodayResponses(): void {
    if (!this.patientId) {
      this.todayResponses = [];
      this.selectedResponse = this.isHistoryMode ? this.selectedResponse : null;
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    this.symptomsResponseService.getResponsesByDate(this.patientId, today).subscribe({
      next: (responses) => {
        this.todayResponses = responses;
        this.hasSubmittedToday = responses.length > 0;

        if (!this.isHistoryMode) {
          this.selectedResponse = this.orderedResponses[0] || null;
          this.submissionMessage = this.hasReachedDailyLimit
            ? 'You have reached the maximum of 3 submissions today'
            : (responses.length > 0 ? 'You can review today\'s submissions below.' : '');
        }
      },
      error: () => {
        this.todayResponses = [];
        if (!this.isHistoryMode) {
          this.selectedResponse = null;
        }
      },
    });
  }

  private loadSymptomsForDate(date: string): void {
    this.isLoading = true;
    this.noData = false;
    this.responses = [];
    this.selectedResponse = null;

    this.symptomsResponseService.getResponsesByDate(this.patientId, date).subscribe({
      next: (data) => {
        if (!data || data.length === 0) {
          this.noData = true;
        } else {
          this.responses = data;
          this.selectedResponse = this.orderedResponses[0] || null;
        }
        this.isLoading = false;
      },
      error: () => {
        this.noData = true;
        this.isLoading = false;
      },
    });
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
    const validators: ValidatorFn[] = [];

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

  private buildAnswersPayload(): SymptomsSubmitAnswer[] {
    return (this.form?.questions ?? [])
      .filter((question): question is SymptomsQuestion & { _id: string } => !!question._id)
      .map((question) => {
        const control = this.formGroup.get(question._id);
        const type = this.normalizeType(question.type);

        if (!control) {
          return null;
        }

        let value: unknown = control.value;

        if (type === 'multiple_choice') {
          const selections = value as boolean[] | null;
          value = (question.options ?? []).filter((_, index) => !!selections?.[index]);
        }

        return {
          questionId: question._id,
          value,
        };
      })
      .filter((answer): answer is SymptomsSubmitAnswer => {
        if (!answer) return false;

        if (Array.isArray(answer.value)) {
          return answer.value.length > 0;
        }

        return answer.value !== null && answer.value !== undefined && answer.value !== '';
      });
  }

  private getCurrentMultipleChoiceArray(): FormArray | null {
    return this.currentQuestionControl instanceof FormArray ? this.currentQuestionControl : null;
  }

  private getQuestionCategory(question: SymptomsQuestion): string {
    return (question as SymptomsQuestion & { category?: string }).category || 'vital_parameters';
  }

  private isQuestionAnswered(question: SymptomsQuestion): boolean {
    const control = this.getControl(question);
    if (!control) return false;

    const type = this.normalizeType(question.type);
    const value = control.value;

    if (type === 'multiple_choice') {
      return Array.isArray(value) && value.some(Boolean);
    }

    return value !== null && value !== undefined && value !== '';
  }

  private markCurrentStepTouched(): void {
    for (const question of this.currentQuestions) {
      this.getControl(question)?.markAsTouched();
      this.getControl(question)?.updateValueAndValidity();
    }
  }

  private markAllTouched(): void {
    for (const question of this.questions) {
      this.getControl(question)?.markAsTouched();
      this.getControl(question)?.updateValueAndValidity();
    }
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

  private resetState(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.noData = false;
    this.responses = [];
    this.todayResponses = [];
    this.selectedResponse = null;
    this.submissionMessage = '';
    this.currentIndex = 0;
    this.currentStep = 0;
  }

  private normalizeAnswers(answers: SymptomsTodayResponse['answers'] | undefined): SymptomsSubmitAnswer[] {
    if (Array.isArray(answers)) {
      return answers.filter((answer): answer is SymptomsSubmitAnswer => {
        return !!answer && typeof answer.questionId === 'string';
      });
    }

    if (!answers || typeof answers !== 'object') {
      return [];
    }

    return Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      value,
    }));
  }

  private formatHistoryDate(date: string): string {
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, (month || 1) - 1, day || 1);

    return parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private getResponseTimestamp(response: SymptomsTodayResponse): number {
    const rawDate =
      response.createdAt ??
      response.updatedAt ??
      response.submittedAt ??
      response.responseDate ??
      response.date;

    if (!rawDate) {
      return 0;
    }

    const parsedDate = new Date(rawDate);
    return Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
  }
}
