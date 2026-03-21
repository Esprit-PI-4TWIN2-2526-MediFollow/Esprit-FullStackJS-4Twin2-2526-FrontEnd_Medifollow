import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Questionnaire } from '../../models/questionnaire';
import { Question, QuestionType } from '../../models/question';
import { QuestionnaireService } from '../../services/questionnaire.service';

@Component({
  selector: 'app-builder',
  templateUrl: './builder.component.html',
  styleUrls: ['./builder.component.css']
})
export class BuilderComponent implements OnInit {

  // Mode create ou edit
  isEditMode = false;
  questionnaireId: string | null = null;
  isSaving = false;
  isLoading = false;
  errorMessage = '';

  // Données du questionnaire
  title = '';
  description = '';
  medicalService = '';
  questions: Question[] = [];
//generation with ai
isGenerating = false;
generateError = '';
generateCount = 7;//nb max of questions to generate

 // ── Validation state ────────────────────────────────────
  submitted = false; // true après le premier clic sur Save
  touchedQuestions: Set<number> = new Set(); // index des questions touchées
  // Liste des services médicaux
  medicalServices = [
    'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
    'General Medicine', 'Orthopedics', 'Dermatology',
    'Psychiatry', 'Radiology', 'Surgery'
  ];

  // Types de questions disponibles
  questionTypes: { value: QuestionType; label: string }[] = [
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
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.questionnaireId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.questionnaireId;

    if (this.isEditMode) {
      this.loadQuestionnaire();
    }
  }

  // ── Chargement en mode edit ─────────────────────────────

  loadQuestionnaire(): void {
    this.isLoading = true;
    this.questionnaireService.getOne(this.questionnaireId!).subscribe({
      next: (q) => {
        this.title          = q.title;
        this.description    = q.description || '';
        this.medicalService = q.medicalService;
        this.questions      = q.questions.sort((a, b) => a.order - b.order);
        this.isLoading      = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load questionnaire.';
        this.isLoading    = false;
      }
    });
  }


// ── Validation helpers ──────────────────────────────────

  get isTitleValid(): boolean {
    return this.title.trim().length >= 3;
  }

  get isMedicalServiceValid(): boolean {
    return this.medicalService.trim() !== '';
  }

  isQuestionLabelValid(index: number): boolean {
    return this.questions[index]?.label.trim().length >= 3;
  }

  hasEnoughOptions(index: number): boolean {
    const q = this.questions[index];
    if (q.type !== 'single_choice' && q.type !== 'multiple_choice') return true;
    return q.options.length >= 2 && q.options.every(o => o.trim() !== '');
  }

isQuestionValid(index: number): boolean {
    return this.isQuestionLabelValid(index) && this.hasEnoughOptions(index);
  }

  get allQuestionsValid(): boolean {
    return this.questions.every((_, i) => this.isQuestionValid(i));
  }

  isFormValid(): boolean {
    return this.isTitleValid
      && this.isMedicalServiceValid
      && this.allQuestionsValid;
  }

  // Marquer une question comme touchée (blur sur le label)
  touchQuestion(index: number): void {
    this.touchedQuestions.add(index);
  }

 showQuestionError(index: number): boolean {
    return (this.submitted || this.touchedQuestions.has(index))
      && !this.isQuestionValid(index);
  }

  showTitleError(): boolean {
    return this.submitted && !this.isTitleValid;
  }

  showServiceError(): boolean {
    return this.submitted && !this.isMedicalServiceValid;
  }
  // ── Gestion des questions ───────────────────────────────

  addQuestion(): void {
    const newQuestion: Question = {
      label:    '',
      type:     'text',
      order:    this.questions.length,
      required: true,
      options:  [],
    };
    this.questions = [...this.questions, newQuestion];
  }

  removeQuestion(index: number): void {
    this.questions = this.questions.filter((_, i) => i !== index);
    // Réindexer l'ordre
    this.questions.forEach((q, i) => q.order = i);
  }

  onTypeChange(index: number, type: QuestionType): void {
    this.questions[index] = {
      ...this.questions[index],
      type,
      options: (type === 'single_choice' || type === 'multiple_choice')
        ? ['Option 1', 'Option 2']
        : [],
    };
  }

  // ── Gestion des options (single/multiple choice) ────────

  addOption(questionIndex: number): void {
    const q = this.questions[questionIndex];
    const newOptions = [...(q.options || []), `Option ${(q.options?.length || 0) + 1}`];
    this.questions[questionIndex] = { ...q, options: newOptions };
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const q = this.questions[questionIndex];
    const newOptions = q.options.filter((_, i) => i !== optionIndex);
    this.questions[questionIndex] = { ...q, options: newOptions };
  }

  updateOption(questionIndex: number, optionIndex: number, value: string): void {
    const q = this.questions[questionIndex];
    const newOptions = [...q.options];
    newOptions[optionIndex] = value;
    this.questions[questionIndex] = { ...q, options: newOptions };
  }

  // ── Drag and drop (ordre manuel) ───────────────────────

  moveUp(index: number): void {
    if (index === 0) return;
    const arr = [...this.questions];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    arr.forEach((q, i) => q.order = i);
    this.questions = arr;
  }

  moveDown(index: number): void {
    if (index === this.questions.length - 1) return;
    const arr = [...this.questions];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    arr.forEach((q, i) => q.order = i);
    this.questions = arr;
  }


 /*  isFormValid(): boolean {
    if (!this.title.trim() || !this.medicalService) return false;
    return this.questions.every(q => q.label.trim() !== '');
  }
 */
  // ── Sauvegarde ──────────────────────────────────────────

  save(): void {
    if (!this.isFormValid()) return;
    this.isSaving = true;
    this.errorMessage = '';

    if (this.isEditMode) {
      this.saveEdit();
    } else {
      this.saveCreate();
    }
  }

  private saveCreate(): void {
    // Créer le questionnaire
    const payload: Partial<Questionnaire> = {
      title:          this.title.trim(),
      description:    this.description.trim(),
      medicalService: this.medicalService,
      status:         'active',
      questions:      [],
    };

    this.questionnaireService.create(payload).subscribe({
      next: (created) => {
        // Ajouter les questions une par une
        this.saveQuestionsSequentially(created._id!, 0);
      },
      error: () => {
        this.errorMessage = 'Failed to create questionnaire.';
        this.isSaving = false;
      }
    });
  }

  private saveQuestionsSequentially(id: string, index: number): void {
    if (index >= this.questions.length) {
      this.isSaving = false;
      this.router.navigate(['/questionnaire']);
      return;
    }

    const q = this.questions[index];
    this.questionnaireService.addQuestion(id, q).subscribe({
      next: () => this.saveQuestionsSequentially(id, index + 1),
      error: () => {
        this.errorMessage = `Failed to save question ${index + 1}.`;
        this.isSaving = false;
      }
    });
  }

  private saveEdit(): void {
    const payload: Partial<Questionnaire> = {
      title:          this.title.trim(),
      description:    this.description.trim(),
      medicalService: this.medicalService,
      questions:      this.questions,
    };

    this.questionnaireService.update(this.questionnaireId!, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/questionnaire']);
      },
      error: () => {
        this.errorMessage = 'Failed to update questionnaire.';
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/questionnaire']);
  }

//generate questions with ai

generateWithAI(): void {
  if (!this.title.trim() || !this.medicalService) {
    this.generateError = 'Please fill in the title and medical service first.';
    return;
  }

  this.isGenerating = true;
  this.generateError = '';

  this.questionnaireService.generateQuestionsWithAI(
    this.medicalService,
    this.title,
    this.description,
    this.generateCount
  ).subscribe({
    next: (result) => {
      // Ajouter les questions générées à la liste existante
      this.questions = [
        ...this.questions,
        ...result.questions.map((q, i) => ({
          ...q,
          order: this.questions.length + i
        }))
      ];
      this.isGenerating = false;
    },
    error: () => {
      this.generateError = 'Failed to generate questions. Please try again.';
      this.isGenerating = false;
    }
  });
}

  // ── Helpers template ────────────────────────────────────

  hasOptions(type: QuestionType): boolean {
    return type === 'single_choice' || type === 'multiple_choice';
  }

  getQuestionPreview(type: QuestionType): string {
    const map: Record<QuestionType, string> = {
      text:            'Patient will provide a text response',
      number:          'Patient will enter a number',
      scale:           'Rating Scale: 1 to 10',
      single_choice:   'Define answer options below',
      multiple_choice: 'Define answer options below',
      date:            'Patient will select a date',
      boolean:         'Patient will answer Yes or No',
    };
    return map[type];
  }

  trackByIndex(index: number): number {
    return index;
  }
}
