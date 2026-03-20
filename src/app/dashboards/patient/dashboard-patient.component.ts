import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsersService } from '../../services/user/users.service';
import { Users } from '../../models/users';
import { Questionnaire } from '../../models/questionnaire';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { QuestionnaireResponsePopulated } from '../../models/questionnaire-response';

@Component({
  selector: 'app-dashboard-patient',
  templateUrl: './dashboard-patient.component.html',
  styleUrl: './dashboard-patient.component.css'
})
export class DashboardPatientComponent implements OnInit {

  currentUser: Users | null = null;
  today = new Date();

  // ── Questionnaires ──────────────────────────────────────
  questionnaires: Questionnaire[] = [];
  isLoadingQuestionnaires = true;
  completedIds: string[] = [];

  constructor(
    private usersService: UsersService,
    private questionnaireService: QuestionnaireService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const localUser = JSON.parse(userStr);
      const userEmail = localUser.email;
      if (!userEmail) return;

      this.usersService.getUserByEmail(userEmail).subscribe({
        next: (user) => {
          this.currentUser = user;
          // Une fois le user chargé on charge les questionnaires de son service
          this.loadQuestionnaires(user.assignedDepartment);
          this.loadCompletedIds(user._id);
        },
        error: (err) => {
          console.error('Error fetching user:', err);
          this.isLoadingQuestionnaires = false;
        }
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.isLoadingQuestionnaires = false;
    }
  }

  loadQuestionnaires(medicalService: string): void {
    this.isLoadingQuestionnaires = true;
    this.questionnaireService.getAll(medicalService).subscribe({
      next: (data) => {
        this.questionnaires = data.filter(q => q.status === 'active');
        this.isLoadingQuestionnaires = false;
      },
      error: () => {
        this.isLoadingQuestionnaires = false;
      }
    });
  }

  loadCompletedIds(patientId: string): void {
    if (!patientId) return;
    this.questionnaireService.getPatientResponses(patientId).subscribe({
      next: (responses: QuestionnaireResponsePopulated[]) => {
        this.completedIds = responses.map(r =>
          typeof r.questionnaireId === 'object'
            ? r.questionnaireId._id
            : r.questionnaireId as string
        );
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────

  getWelcomeName(): string {
    return this.currentUser?.firstName?.trim() || 'there';
  }

  isCompleted(id: string): boolean {
    return this.completedIds.includes(id);
  }

  estimateTime(count: number): string {
    return `${count * 1}-${count * 2} min`;
  }

  startQuestionnaire(id: string): void {
    this.router.navigate(['/patient/questionnaire', id]);
  }
}
