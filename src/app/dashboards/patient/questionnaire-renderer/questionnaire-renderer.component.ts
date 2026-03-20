import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from '../../../services/user/users.service';
import { Questionnaire } from '../../../models/questionnaire';
import { QuestionnaireService } from '../../../services/questionnaire.service';
import { Question } from '../../../models/question';

@Component({
  selector: 'app-questionnaire-renderer',
  templateUrl: './questionnaire-renderer.component.html',
  styleUrl: './questionnaire-renderer.component.css'
})
export class QuestionnaireRendererComponent implements OnInit {

  questionnaireId = '';
  questionnaire: Questionnaire | null = null;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  isSubmitted = false;

  currentIndex = 0;
  answers: Record<string, any> = {};
  notes = '';
  patientId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionnaireService: QuestionnaireService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    this.questionnaireId = this.route.snapshot.paramMap.get('id')!;
    this.loadPatientId();
    this.loadQuestionnaire();
  }

  // ── Load patient from localStorage ─────────────────────

  loadPatientId(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const localUser = JSON.parse(userStr);
      this.usersService.getUserByEmail(localUser.email).subscribe({
        next: (user) => { this.patientId = user._id || ''; }
      });
    } catch (e) {
      console.error('Error loading patient:', e);
    }
  }

  // ── Load questionnaire ──────────────────────────────────

  loadQuestionnaire(): void {
    this.questionnaireService.getOne(this.questionnaireId).subscribe({
      next: (q) => {
        this.questionnaire = q;
        // Initialiser toutes les réponses à null
        q.questions
          .sort((a, b) => a.order - b.order)
          .forEach(question => {
            this.answers[question._id!] =
              question.type === 'multiple_choice' ? [] : null;
          });
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load questionnaire.';
        this.isLoading = false;
      }
    });
  }

  // ── Getters ─────────────────────────────────────────────

  get currentQuestion(): Question {
    return this.questionnaire!.questions[this.currentIndex];
  }

  get totalQuestions(): number {
    return this.questionnaire?.questions.length || 0;
  }

  get progressPercent(): number {
    return Math.round(((this.currentIndex + 1) / this.totalQuestions) * 100);
  }

  get isLastQuestion(): boolean {
    return this.currentIndex === this.totalQuestions - 1;
  }

  get isFirstQuestion(): boolean {
    return this.currentIndex === 0;
  }

  get scaleValues(): number[] {
    const min = this.currentQuestion.validation?.min ?? 1;
    const max = this.currentQuestion.validation?.max ?? 10;
    return Array.from({ length: max - min + 1 }, (_, i) => i + min);
  }

  // ── Validation ──────────────────────────────────────────

  canGoNext(): boolean {
    const q = this.currentQuestion;
      // Champ non requis : valide seulement si pas d'erreur sur ce qui est saisi
  if (!q.required) {
    return this.getFieldError() === '';
  }
    const val = this.answers[q._id!];
    if (val === null || val === undefined) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }

  // ── Navigation ──────────────────────────────────────────

  next(): void {
    if (!this.canGoNext()) return;
    if (!this.isLastQuestion) this.currentIndex++;
  }

  previous(): void {
    if (!this.isFirstQuestion) this.currentIndex--;
  }

  goBack(): void {
    this.router.navigate(['/patient/dashboard']);
  }

  // ── Answer handlers ─────────────────────────────────────

  onScaleSelect(value: number): void {
    this.answers[this.currentQuestion._id!] = value;
  }

  isScaleSelected(value: number): boolean {
    return this.answers[this.currentQuestion._id!] === value;
  }

  onMultipleChoiceToggle(option: string): void {
    const id = this.currentQuestion._id!;
    const current: string[] = this.answers[id] || [];
    this.answers[id] = current.includes(option)
      ? current.filter(o => o !== option)
      : [...current, option];
  }

  isOptionChecked(option: string): boolean {
    const val = this.answers[this.currentQuestion._id!];
    return Array.isArray(val) && val.includes(option);
  }

// ── Validation ──────────────────────────────────────────

getFieldError(): string {
  const q = this.currentQuestion;
  const val = this.answers[q._id!];

  // Pas encore touché
  if (val === null || val === undefined) return '';

  switch (q.type) {

    case 'text':
      if (typeof val === 'string' && val.trim() === '')
        return 'This field cannot be empty.';
      if (typeof val === 'string' && val.trim().length < 3)
        return 'Please enter at least 3 characters.';
      break;

    case 'number':
      if (val === '') return '';
      const num = Number(val);
      if (isNaN(num)) return 'Please enter a valid number.';
      if (q.validation?.min !== undefined && num < q.validation.min)
        return `Value must be at least ${q.validation.min}.`;
      if (q.validation?.max !== undefined && num > q.validation.max)
        return `Value must be at most ${q.validation.max}.`;
      break;

    case 'scale':
      if (val === null) return 'Please select a value.';
      break;

    case 'single_choice':
      if (!val) return 'Please select an option.';
      break;

    case 'multiple_choice':
      if (Array.isArray(val) && val.length === 0)
        return 'Please select at least one option.';
      break;

    case 'date':
      if (!val) return '';
      const date = new Date(val);
      if (isNaN(date.getTime())) return 'Please enter a valid date.';
      if (date > new Date()) return 'Date cannot be in the future.';
      break;

    case 'boolean':
      if (val === null) return 'Please select Yes or No.';
      break;
  }
  return '';
}

// Indique si le champ a été "touché" (valeur non null)
isTouched(): boolean {
  const val = this.answers[this.currentQuestion._id!];
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' && val === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}



  // ── Submit ──────────────────────────────────────────────

  submit(): void {
    if (!this.canGoNext()) return;
    this.isSubmitting = true;
    this.errorMessage = '';

    const answersArray = Object.entries(this.answers).map(
      ([questionId, value]) => ({ questionId, value })
    );

    this.questionnaireService.submitResponse(this.questionnaireId, {
      patientId:  this.patientId,
      answers:    answersArray,
      notes:      this.notes
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.isSubmitted  = true;
      },
      error: () => {
        this.errorMessage = 'Error while submitting. Please try again.';
        this.isSubmitting = false;
      }
    });
  }
}
