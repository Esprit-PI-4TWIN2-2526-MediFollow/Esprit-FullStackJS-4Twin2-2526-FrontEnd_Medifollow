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
import { ServiceManagementService } from '../../services/service/service-management.service';

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
  selectedPatients: string[] = [];
  searchTerm = '';
  showPatientModal = false;
  patientsWithForm: string[] = [];
  questions: SymptomQuestion[] = [];
  patients: Users[] = [];

  // ── Validation state ─────────────────────────────────────
  submitted = false;
  touchedQuestions: Set<number> = new Set();

  // ── Static data ──────────────────────────────────────────
  // medicalServices = [
  //   'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
  //   'General Medicine', 'Orthopedics', 'Dermatology',
  //   'Psychiatry', 'Radiology', 'Surgery',
  // ];
medicalServices: string[] = [];

  readonly inputTypes: { value: SymptomQuestionType; label: string }[] = [
    { value: 'text',            label: 'Text Response' },
    { value: 'number',          label: 'Number' },
    { value: 'scale',           label: 'Rating Scale' },
    { value: 'single_choice',   label: 'Single Choice' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'date',            label: 'Date' },
    { value: 'boolean',         label: 'Yes / No' },
  ];

  // ── Default static questions added on form creation ──────
  private readonly defaultQuestions: Omit<SymptomQuestion, 'order'>[] = [
    {
      label:    'What is your pain level?',
      type:     'scale',
      options:  [],
      required: true,
    },
    {
      label:    'What is your body temperature (°C)?',
      type:     'number',
      options:  [],
      required: true,
    },
    {
      label:    'Have you changed your dressing?',
      type:     'boolean',
      options:  [],
      required: true,
    },
    {
      label:    'What is your oxygen level (SpO2 %)?',
      type:     'number',
      options:  [],
      required: true,
    },
    {
      label:    'What is your blood sugar level (mg/dL)?',
      type:     'number',
      options:  [],
      required: true,
    },
    {
      label:    'What is your heart rate (bpm)?',
      type:     'number',
      options:  [],
      required: true,
    },
    {
      label:    'What is your blood pressure (e.g. 120/80)?',
      type:     'text',
      options:  [],
      required: true,
    },
    {
      label:    'Is your urine output normal?',
      type:     'boolean',
      options:  [],
      required: true,
    },
    {
      label:    'What is your level of consciousness?',
      type:     'scale',
      options:  [],
      required: true,
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private symptomService: SymptomService,
    private usersService: UsersService,
private serviceManagementService:ServiceManagementService
  ) {}

  ngOnInit(): void {
    this.formId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.formId;
    this.loadPatients();
    this.loadPatientsWithForms();
this.loadDepartments();

    if (this.isEditMode) {
      this.loadForm();
      return;
    }

    this.addDefaultQuestions();
  }

//loadservices
loadDepartments(): void {
  this.serviceManagementService.getAll().subscribe({
    next: (services) => {
      this.medicalServices = services
        .filter(s => s.statut === 'ACTIF')  // uniquement les services actifs
        .map(s => s.nom);
    },
    error: (err) => console.error('Error loading departments:', err)
  });
}

  // ── Validation helpers ───────────────────────────────────

  get isTitleValid(): boolean {
    return this.title.trim().length >= 3;
  }

  get isMedicalServiceValid(): boolean {
    return this.medicalService.trim() !== '';
  }

  get isPatientValid(): boolean {
    return this.selectedPatients.length > 0;
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

  addDefaultQuestions(): void {
    this.questions = this.defaultQuestions.map((q, i) => ({ ...q, order: i }));
  }

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

  // ── Patient selection ────────────────────────────────────

  loadPatientsWithForms(): void {
    this.symptomService.getForms().subscribe({
      next: (forms) => {
        this.patientsWithForm = Array.from(new Set(forms
          .filter((form) => form._id !== this.formId)
          .flatMap((form) => {
            const maybeForm = form as SymptomForm & { patientIds?: string[] };
            if (Array.isArray(maybeForm.patientIds) && maybeForm.patientIds.length > 0) {
              return maybeForm.patientIds;
            }

            return form.patientId ? [form.patientId] : [];
          })
          .filter((patientId): patientId is string => typeof patientId === 'string' && patientId.trim() !== '')));
      },
      error: (err) => {
        console.error('Failed to load patients with forms', err);
        this.patientsWithForm = [];
      },
    });
  }

  openPatientModal(): void {
    this.showPatientModal = true;
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.searchTerm = '';
  }

  togglePatient(id: string): void {
    if (!id || this.isPatientDisabled(id)) return;

    if (this.selectedPatients.includes(id)) {
      this.selectedPatients = this.selectedPatients.filter((patientId) => patientId !== id);
      return;
    }

    this.selectedPatients = [...this.selectedPatients, id];
  }

  clearSelectedPatients(): void {
    this.selectedPatients = [];
  }

  isPatientDisabled(id: string): boolean {
    return this.patientsWithForm.includes(id) && !this.selectedPatients.includes(id);
  }

  get filteredPatients(): Users[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.patients;

    return this.patients.filter((patient) => {
      const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim().toLowerCase();
      const email = String(patient.email || '').toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }

  get selectedPatientNames(): string {
    if (this.selectedPatients.length === 0) {
      return 'No patients selected';
    }

    const selected = this.patients.filter((patient) => this.selectedPatients.includes(patient._id || ''));
    const names = selected
      .map((patient) => `${patient.firstName || ''} ${patient.lastName || ''}`.trim())
      .filter(Boolean);

    if (names.length === 0) {
      return `${this.selectedPatients.length} patient${this.selectedPatients.length > 1 ? 's' : ''} selected`;
    }

    if (names.length <= 2) {
      return names.join(', ');
    }

    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
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

    const payload: Partial<SymptomForm> & { patientIds: string[] } = {
      title:          this.title.trim(),
      description:    this.description.trim(),
      medicalService: this.medicalService,
      patientIds:     this.selectedPatients,
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
        this.closePatientModal();
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
        const maybeForm = form as SymptomForm & { patientIds?: string[] };
        this.selectedPatients = Array.isArray(maybeForm.patientIds)
          ? maybeForm.patientIds.filter((patientId) => typeof patientId === 'string' && patientId.trim() !== '')
          : (form.patientId ? [form.patientId] : []);
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
