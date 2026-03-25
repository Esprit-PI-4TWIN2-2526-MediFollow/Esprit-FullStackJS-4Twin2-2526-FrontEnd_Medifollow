import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Users } from '../../../models/users';
import { UsersService } from '../../../services/user/users.service';
import { QuestionnaireResponsePopulated } from '../../../models/questionnaire-response';
import { Questionnaire } from '../../../models/questionnaire';
import { QuestionnaireService } from '../../../services/questionnaire.service';

@Component({
  selector: 'app-patient-responses',
  templateUrl: './patient-responses.component.html',
  styleUrl: './patient-responses.component.css'
})
export class PatientResponsesComponent implements OnInit {

  patientId = '';
  patient: Users | null = null;
  responses: QuestionnaireResponsePopulated[] = [];
  questionnairesMap: Record<string, Questionnaire> = {};

  isLoadingPatient = true;
  isLoadingResponses = true;
  errorMessage = '';

  // Réponse sélectionnée pour le détail
  selectedResponse: QuestionnaireResponsePopulated | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id')!;
    this.loadPatient();
    this.loadResponses();
  }

  // ── Load patient info ───────────────────────────────────

  loadPatient(): void {
    this.isLoadingPatient = true;
    this.usersService.getUserById(this.patientId).subscribe({
      next: (user) => {
        this.patient = user;
        this.isLoadingPatient = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load patient information.';
        this.isLoadingPatient = false;
      }
    });
  }

  // ── Load responses ──────────────────────────────────────

  loadResponses(): void {
    this.isLoadingResponses = true;
    this.questionnaireService.getPatientResponses(this.patientId).subscribe({
      next: (responses) => {
        this.responses = responses;
        this.isLoadingResponses = false;
        // Charger les questionnaires pour avoir les labels des questions
        this.loadQuestionnaires(responses);
        // Sélectionner la première réponse par défaut
        if (responses.length > 0) {
          this.selectedResponse = responses[0];
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load responses.';
        this.isLoadingResponses = false;
      }
    });
  }

  loadQuestionnaires(responses: QuestionnaireResponsePopulated[]): void {
    const ids = new Set<string>();
    responses.forEach(r => {
      const id = typeof r.questionnaireId === 'object'
        ? r.questionnaireId._id
        : r.questionnaireId as string;
      ids.add(id);
    });

    ids.forEach(id => {
      this.questionnaireService.getOne(id).subscribe({
        next: (q) => { this.questionnairesMap[id] = q; }
      });
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  getQuestionnaireId(response: QuestionnaireResponsePopulated): string {
    return typeof response.questionnaireId === 'object'
      ? response.questionnaireId._id
      : response.questionnaireId as string;
  }

  getQuestionnaireTitle(response: QuestionnaireResponsePopulated): string {
    if (typeof response.questionnaireId === 'object') {
      return response.questionnaireId.title;
    }
    const id = response.questionnaireId as string;
    return this.questionnairesMap[id]?.title || 'Unknown questionnaire';
  }

  getQuestionnaireMedicalService(response: QuestionnaireResponsePopulated): string {
    if (typeof response.questionnaireId === 'object') {
      return response.questionnaireId.medicalService;
    }
    const id = response.questionnaireId as string;
    return this.questionnairesMap[id]?.medicalService || '';
  }

  getQuestionLabel(response: QuestionnaireResponsePopulated, questionId: string): string {
    const qId = this.getQuestionnaireId(response);
    const questionnaire = this.questionnairesMap[qId];
    if (!questionnaire) return questionId;
    const question = questionnaire.questions.find(q => q._id === questionId);
    return question?.label || questionId;
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  getValueBadgeClass(value: any): string {
    if (typeof value === 'boolean') {
      return value
        ? 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400'
        : 'bg-error-50 text-error-600 border-error-200 dark:bg-error-900/20 dark:text-error-400';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }

  getUserInitials(): string {
    if (!this.patient) return '?';
    const f = this.patient.firstName?.charAt(0) || '';
    const l = this.patient.lastName?.charAt(0) || '';
    return (f + l).toUpperCase();
  }

  selectResponse(response: QuestionnaireResponsePopulated): void {
    this.selectedResponse = response;
  }

  isSelected(response: QuestionnaireResponsePopulated): boolean {
    return this.selectedResponse === response;
  }

  goBack(): void {
    this.router.navigate(['/doctor/dashboard']);
  }
}
