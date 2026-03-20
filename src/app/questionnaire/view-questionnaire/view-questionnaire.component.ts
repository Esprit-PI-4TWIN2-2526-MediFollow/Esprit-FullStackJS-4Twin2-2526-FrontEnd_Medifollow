import { Component, OnInit } from '@angular/core';
import { Questionnaire } from '../../models/questionnaire';
import { QuestionnaireResponsePopulated } from '../../models/questionnaire-response';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionnaireService } from '../../services/questionnaire.service';

@Component({
  selector: 'app-view-questionnaire',
  templateUrl: './view-questionnaire.component.html',
  styleUrl: './view-questionnaire.component.css'
})
export class ViewQuestionnaireComponent implements OnInit{


  questionnaireId: string = '';
  questionnaire: Questionnaire | null = null;
  responses: QuestionnaireResponsePopulated[] = [];

  isLoading = true;
  isLoadingResponses = true;
  errorMessage = '';

  // Tab actif : 'overview' | 'responses'
  activeTab: 'overview' | 'responses' = 'overview';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.questionnaireId = this.route.snapshot.paramMap.get('id')!;
    this.loadQuestionnaire();
    this.loadResponses();
  }

  // ── Chargement ──────────────────────────────────────────

  loadQuestionnaire(): void {
    this.isLoading = true;
    this.questionnaireService.getOne(this.questionnaireId).subscribe({
      next: (q) => {
        this.questionnaire = q;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load questionnaire.';
        this.isLoading = false;
      }
    });
  }

  loadResponses(): void {
    this.isLoadingResponses = true;
    this.questionnaireService.getResponses(this.questionnaireId).subscribe({
      next: (responses) => {
        this.responses = responses;
        this.isLoadingResponses = false;
      },
      error: () => {
        this.isLoadingResponses = false;
      }
    });
  }

  // ── Navigation ──────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/questionnaire']);
  }

  goToEdit(): void {
    this.router.navigate(['/questionnaire/edit', this.questionnaireId]);
  }

  // ── Helpers ─────────────────────────────────────────────

  getQuestionLabel(questionId: string): string {
    if (!this.questionnaire) return questionId;
    const q = this.questionnaire.questions.find(q => q._id === questionId);
    return q ? q.label : questionId;
  }

  getQuestionType(questionId: string): string {
    if (!this.questionnaire) return '';
    const q = this.questionnaire.questions.find(q => q._id === questionId);
    return q ? q.type : '';
  }

  formatValue(value: any, questionId: string): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  getTypeLabel(type: string): string {
    const map: Record<string, string> = {
      text:            'Text',
      number:          'Number',
      scale:           'Scale',
      single_choice:   'Single choice',
      multiple_choice: 'Multiple choice',
      date:            'Date',
      boolean:         'Yes / No',
    };
    return map[type] || type;
  }

  getTypeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      text:            'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      number:          'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
      scale:           'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      single_choice:   'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
      multiple_choice: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
      date:            'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      boolean:         'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    };
    return map[type] || '';
  }

  getPatientName(response: QuestionnaireResponsePopulated): string {
    if (typeof response.patientId === 'object' && response.patientId) {
      return `${response.patientId.firstName} ${response.patientId.lastName}`;
    }
    return 'Unknown Patient';
  }

  getPatientEmail(response: QuestionnaireResponsePopulated): string {
    if (typeof response.patientId === 'object' && response.patientId) {
      return response.patientId.email;
    }
    return '—';
  }

  getPatientInitials(response: QuestionnaireResponsePopulated): string {
    if (typeof response.patientId === 'object' && response.patientId) {
      const f = response.patientId.firstName?.charAt(0) || '';
      const l = response.patientId.lastName?.charAt(0) || '';
      return (f + l).toUpperCase();
    }
    return '?';
  }
}
