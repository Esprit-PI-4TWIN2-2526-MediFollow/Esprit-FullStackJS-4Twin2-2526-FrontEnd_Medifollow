import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import {
  SymptomForm,
  SymptomAiQuestion,
  SymptomQuestionType,
  SymptomService,
} from '../services/symptom.service';

// Internal model (mirrors Questionnaires' Question shape)
interface SymptomQuestion {
  label: string;
  type: SymptomQuestionType;
  options: string[];
  required: boolean;
  order: number;
}

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrl: './builder.component.css',
})
export class BuilderComponent implements OnInit {
  isEditMode = false;
  formId: string | null = null;
  isLoading = false;

  // ── State ────────────────────────────────────────────────
  isSubmitting = false;
  isGenerating = false;
  errorMessage = '';
  generateError = '';
  generateCount = 5;

  // ── Form data ────────────────────────────────────────────
  title = '';
  description = '';
  medicalService = '';
  patientId = '';
  questions: SymptomQuestion[] = [];
  patients: Users[] = [];

  // ── Validation state ─────────────────────────────────────
  submitted = false;
  touchedQuestions: Set<number> = new Set();

  // ── Static data ──────────────────────────────────────────
  medicalServices = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
    'General Medicine', 'Orthopedics', 'Dermatology',
    'Psychiatry', 'Radiology', 'Surgery',
  ];

  readonly inputTypes: { value: SymptomQuestionType; label: string }[] = [
    { value: 'text',            label: 'Text Response' },
    { value: 'number',          label: 'Number' },
    { value: 'scale',           label: 'Rating Scale' },
    { value: 'single_choice',   label: 'Single Choice' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'date',            label: 'Date' },
    { value: 'boolean',         label: 'Yes / No' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private symptomService: SymptomService,
    private usersService: UsersService,
  ) {}

  ngOnInit(): void {
    this.loadPatients();

    this.formId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.formId;

    if (this.isEditMode) {
      this.loadForm();
      return;
    }

    this.addQuestion();
  }

  // ── Validation helpers ───────────────────────────────────

  get isTitleValid(): boolean {
    return this.title.trim().length >= 3;
  }

  get isMedicalServiceValid(): boolean {
    return this.medicalService.trim() !== '';
  }

  get isPatientValid(): boolean {
    return this.patientId.trim() !== '';
  }

  isQuestionLabelValid(index: number): boolean {
    return (this.questions[index]?.label.trim().length ?? 0) >= 3;
  }

  hasEnoughOptions(index: number): boolean {
    const q = this.questions[index];
    if (!this.hasOptions(q.type)) return true;
    return q.options.length >= 2 && q.options.every(o => o.trim() !== '');
  }

  isQuestionValid(index: number): boolean {
    return this.isQuestionLabelValid(index) && this.hasEnoughOptions(index);
  }

  get allQuestionsValid(): boolean {
    return this.questions.every((_, i) => this.isQuestionValid(i));
  }

  isFormValid(): boolean {
    return this.isTitleValid && this.isMedicalServiceValid && this.isPatientValid && this.allQuestionsValid;
  }

  touchQuestion(index: number): void {
    this.touchedQuestions.add(index);
  }

  showTitleError(): boolean {
    return this.submitted && !this.isTitleValid;
  }

  showServiceError(): boolean {
    return this.submitted && !this.isMedicalServiceValid;
  }

  showPatientError(): boolean {
    return this.submitted && !this.isPatientValid;
  }

  showQuestionError(index: number): boolean {
    return (this.submitted || this.touchedQuestions.has(index))
      && !this.isQuestionValid(index);
  }

  // ── Question management ──────────────────────────────────

  addQuestion(): void {
    this.questions = [
      ...this.questions,
      {
        label:    '',
        type:     'text',
        options:  [],
        required: true,
        order:    this.questions.length,
      },
    ];
  }

  removeQuestion(index: number): void {
    if (this.questions.length === 1) return;
    this.questions = this.questions.filter((_, i) => i !== index);
    this.questions.forEach((q, i) => (q.order = i));
    this.touchedQuestions.delete(index);
  }

  onTypeChange(index: number, type: SymptomQuestionType): void {
    const q = this.questions[index];
    this.questions[index] = {
      ...q,
      type,
      options: this.hasOptions(type) ? ['Option 1', 'Option 2'] : [],
    };
  }

  // ── Option management ────────────────────────────────────

  addOption(questionIndex: number): void {
    const q = this.questions[questionIndex];
    const newOptions = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
    this.questions[questionIndex] = { ...q, options: newOptions };
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const q = this.questions[questionIndex];
    if (q.options.length <= 2) return;
    this.questions[questionIndex] = {
      ...q,
      options: q.options.filter((_, i) => i !== optionIndex),
    };
  }

  updateOption(questionIndex: number, optionIndex: number, value: string): void {
    const q = this.questions[questionIndex];
    const newOptions = [...q.options];
    newOptions[optionIndex] = value;
    this.questions[questionIndex] = { ...q, options: newOptions };
  }

  // ── AI Generation ────────────────────────────────────────

  generateWithAI(): void {
    if (!this.title.trim() || !this.medicalService) {
      this.generateError = 'Please fill in the title and medical service first.';
      return;
    }

    this.isGenerating  = true;
    this.generateError = '';

    this.symptomService
      .generateQuestionsWithAI(this.title, this.description, this.generateCount)
      .subscribe({
        next: (result) => {
          const normalized = result.questions.map((q, i) => ({
            ...this.normalizeAiQuestion(q),
            required: true,
            order:    this.questions.length + i,
          }));
          this.questions   = [...this.questions, ...normalized];
          this.isGenerating = false;
        },
        error: (err) => {
          console.error('Failed to generate symptom questions', err);
          this.generateError = 'Failed to generate questions. Please try again.';
          this.isGenerating  = false;
        },
      });
  }

  // ── Submit ───────────────────────────────────────────────

  submit(): void {
    this.submitted = true;

    if (!this.isFormValid()) return;

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload: Partial<SymptomForm> = {
      title:          this.title.trim(),
      description:    this.description.trim(),
      medicalService: this.medicalService,
      patientId:      this.patientId,
      questions:      this.questions.map((q) => ({
        label:    q.label.trim(),
        type:     q.type,
        required: q.required,
        order:    q.order,
        ...(this.hasOptions(q.type)
          ? { options: q.options.map(o => o.trim()).filter(Boolean) }
          : {}),
      })),
    };

    const request$ = this.isEditMode && this.formId
      ? this.symptomService.updateForm(this.formId, payload)
      : this.symptomService.createForm(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/symptoms']);
      },
      error: (err) => {
        console.error('Failed to save symptoms form', err);
        this.isSubmitting = false;
        this.errorMessage = `Unable to ${this.isEditMode ? 'update' : 'create'} the form. Please try again.`;
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/symptoms']);
  }

  // ── Template helpers ─────────────────────────────────────

  hasOptions(type: SymptomQuestionType): boolean {
    return type === 'single_choice' || type === 'multiple_choice';
  }

  getQuestionPreview(type: SymptomQuestionType): string {
    const map: Record<SymptomQuestionType, string> = {
      text:            'Patient will provide a text response',
      number:          'Patient will enter a number',
      scale:           'Rating Scale: 1 to 10',
      single_choice:   'Define answer options below',
      multiple_choice: 'Define answer options below',
      date:            'Patient will select a date',
      boolean:         'Patient will answer Yes or No',
    };
    return map[type] ?? '';
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ── Private helpers ──────────────────────────────────────

  private loadForm(): void {
    if (!this.formId) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.symptomService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.title = form.title || '';
        this.description = form.description || '';
        this.medicalService = form.medicalService || '';
        this.patientId = form.patientId || '';
        this.questions = (form.questions || []).map((question, index) => ({
          label: question.label || '',
          type: this.normalizeType(question.type),
          options: this.hasOptions(this.normalizeType(question.type))
            ? (question.options || []).map((option) => option.trim()).filter(Boolean)
            : [],
          required: true,
          order: index,
        }));

        if (this.questions.length === 0) {
          this.addQuestion();
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load symptoms form', err);
        this.errorMessage = 'Unable to load the selected symptoms form.';
        this.isLoading = false;
      }
    });
  }

  private loadPatients(): void {
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.patients = users.filter((user) => user.role === 'patient');
        console.log(this.patients);
      },
      error: (err) => {
        console.error('Failed to load patients', err);
        this.patients = [];
      },
    });
  }

  private normalizeAiQuestion(question: SymptomAiQuestion): {
    label: string;
    type: SymptomQuestionType;
    options: string[];
  } {
    const type = this.normalizeType(question.type);
    return {
      label:   String(question.label || '').trim(),
      type,
      options: this.hasOptions(type)
        ? (Array.isArray(question.options)
            ? question.options.map(o => o.trim()).filter(Boolean)
            : [])
        : [],
    };
  }

  private normalizeType(type: SymptomQuestionType | string | undefined): SymptomQuestionType {
    switch (type) {
      case 'text':
      case 'number':
      case 'scale':
      case 'single_choice':
      case 'multiple_choice':
      case 'date':
      case 'boolean':
        return type;
      case 'rating':  return 'scale';
      case 'single':  return 'single_choice';
      case 'multiple': return 'multiple_choice';
      default:         return 'text';
    }
  }
}
