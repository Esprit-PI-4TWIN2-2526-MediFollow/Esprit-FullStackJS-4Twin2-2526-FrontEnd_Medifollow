import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CoordinatorFollowUpService,
  CoordinatorProtocolDetails,
  CoordinatorProtocolStatus
} from '../../services/coordinator-follow-up.service';
import { QuestionnaireResponsePopulated } from '../../models/questionnaire-response';
import { QuestionnaireService } from '../../services/questionnaire.service';

@Component({
  selector: 'app-coordinator-protocol-details',
  templateUrl: './coordinator-protocol-details.component.html',
  styleUrl: './coordinator-protocol-details.component.css'
})
export class CoordinatorProtocolDetailsComponent implements OnInit {
  details: CoordinatorProtocolDetails | null = null;
  questionnaireHistory: Array<{ title: string; submittedAt: string | null; status: string; answersCount: number }> = [];
  isLoadingQuestionnaires = false;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coordinatorFollowUpService: CoordinatorFollowUpService,
    private questionnaireService: QuestionnaireService
  ) {}

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('patientId') || '';
    this.loadDetails(patientId);
  }

  goBack(): void {
    this.router.navigate(['/coordinator/follow-up/protocol']);
  }

  getStatusClasses(status: CoordinatorProtocolStatus): string {
    return status.done
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300'
      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300';
  }

  private loadDetails(patientId: string): void {
    if (!patientId) {
      this.errorMessage = 'Patient not found.';
      this.isLoading = false;
      return;
    }

    this.coordinatorFollowUpService.getProtocolDetails(patientId).subscribe({
      next: (details) => {
        this.details = details;
        this.isLoading = false;
        this.loadQuestionnaireHistory(patientId);
      },
      error: () => {
        this.errorMessage = 'Unable to load protocol details.';
        this.isLoading = false;
      }
    });
  }

  private loadQuestionnaireHistory(patientId: string): void {
    this.isLoadingQuestionnaires = true;

    this.questionnaireService.getPatientResponses(patientId).subscribe({
      next: (responses: QuestionnaireResponsePopulated[]) => {
        const mapped = responses.map((response) => ({
          title: response?.questionnaireId?.title || 'Questionnaire',
          submittedAt: response?.createdAt ? new Date(response.createdAt).toISOString() : null,
          status: 'Submitted',
          answersCount: Array.isArray(response?.answers) ? response.answers.length : 0
        }));

        this.questionnaireHistory = mapped.sort((a, b) => {
          const left = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
          const right = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
          return right - left;
        });

        this.syncQuestionnaireStatusFromResponses();
        this.isLoadingQuestionnaires = false;
      },
      error: () => {
        this.isLoadingQuestionnaires = false;
      }
    });
  }

  private syncQuestionnaireStatusFromResponses(): void {
    if (!this.details) {
      return;
    }

    const expected = this.details.questionnaireExpectedCount;
    const submittedCount = this.questionnaireHistory.length;

    const done = expected && expected > 0
      ? submittedCount >= expected
      : submittedCount > 0;

    this.details = {
      ...this.details,
      statuses: this.details.statuses.map((status) =>
        status.key === 'questionnaireCompleted'
          ? { ...status, done }
          : status
      )
    };
  }
}
