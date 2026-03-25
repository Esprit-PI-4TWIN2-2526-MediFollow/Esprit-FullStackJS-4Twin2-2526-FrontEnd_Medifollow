import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { UsersService } from '../../services/user/users.service';
import { Users } from '../../models/users';
import { Questionnaire } from '../../models/questionnaire';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { QuestionnaireResponsePopulated } from '../../models/questionnaire-response';
import { SymptomDayCell, SymptomResponse } from './symptoms-response.model';
import { SymptomsResponseService } from './symptoms-response.service';

@Component({
  selector: 'app-dashboard-patient',
  templateUrl: './dashboard-patient.component.html',
  styleUrl: './dashboard-patient.component.css'
})
export class DashboardPatientComponent implements OnInit {

  currentUser: Users | null = null;
  today = new Date();
  symptomDays: SymptomDayCell[] = [];
  streak = 0;

  // ── Questionnaires ──────────────────────────────────────
  questionnaires: Questionnaire[] = [];
  isLoadingQuestionnaires = true;
  completedIds: string[] = [];

  constructor(
    private usersService: UsersService,
    private questionnaireService: QuestionnaireService,
    private symptomsResponseService: SymptomsResponseService,
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
          this.loadPatientDashboardData(user);
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

  private loadPatientDashboardData(user: Users): void {
    this.loadQuestionnaires(user.assignedDepartment);

    forkJoin({
      completedResponses: this.questionnaireService.getPatientResponses(user._id).pipe(
        catchError(() => of([] as QuestionnaireResponsePopulated[]))
      ),
      symptomResponses: this.symptomsResponseService.getPatientResponses(user._id).pipe(
        catchError(() => of([] as SymptomResponse[]))
      )
    }).subscribe({
      next: ({ completedResponses, symptomResponses }) => {
        this.completedIds = completedResponses.map(response =>
          typeof response.questionnaireId === 'object'
            ? response.questionnaireId._id
            : response.questionnaireId as string
        );

        this.initializeSymptomsStreak(user.createdAt, symptomResponses);
      },
      error: () => {
        this.completedIds = [];
        this.initializeSymptomsStreak(user.createdAt, []);
      }
    });
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

  fillTodaySymptoms(): void {
    this.router.navigate(['/patient/symptoms']);
  }

  private initializeSymptomsStreak(createdAt: string | Date, responses: SymptomResponse[]): void {
    this.symptomDays = this.generateSymptomDays(createdAt, responses);
    this.streak = this.calculateStreak(this.symptomDays);
  }

  private generateSymptomDays(createdAt: string | Date, responses: SymptomResponse[]): SymptomDayCell[] {
    const createdDate = this.startOfDay(createdAt ? new Date(createdAt) : this.today);
    const today = this.startOfDay(this.today);
    const submittedDays = new Set(
      responses
        .map(response => this.extractResponseDate(response))
        .filter((value): value is string => value !== null)
    );
    const days: SymptomDayCell[] = [];
    const cursor = new Date(createdDate);

    while (cursor <= today) {
      const isoDate = this.toDateKey(cursor);
      const isToday = isoDate === this.toDateKey(today);
      const hasSubmission = submittedDays.has(isoDate);
      const status = isToday
        ? hasSubmission ? 'today-submitted' : 'today'
        : hasSubmission ? 'submitted' : 'missed';

      days.push({
        date: new Date(cursor),
        status,
        tooltip: `${this.formatTooltipDate(cursor)} - ${this.getStatusLabel(status)}`,
        isToday
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    while (days.length % 10 !== 0) {
      const futureDate = new Date(cursor);

      days.push({
        date: futureDate,
        status: 'empty',
        tooltip: `${this.formatTooltipDate(futureDate)} - ${this.getStatusLabel('empty')}`,
        isToday: false
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private calculateStreak(days: SymptomDayCell[]): number {
    let streak = 0;

    for (let index = days.length - 1; index >= 0; index--) {
      const status = days[index].status;

      if (status === 'empty') {
        continue;
      }

      if (status === 'submitted' || status === 'today-submitted') {
        streak++;
        continue;
      }

      break;
    }

    return streak;
  }

  private extractResponseDate(response: SymptomResponse): string | null {
    const rawDate = response.submittedAt ?? response.responseDate ?? response.date ?? response.createdAt;
    if (!rawDate) {
      return null;
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return this.toDateKey(parsedDate);
  }

  private startOfDay(date: Date): Date {
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    return normalizedDate;
  }

  private toDateKey(date: Date): string {
    const normalizedDate = this.startOfDay(date);
    const year = normalizedDate.getFullYear();
    const month = `${normalizedDate.getMonth() + 1}`.padStart(2, '0');
    const day = `${normalizedDate.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatTooltipDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  }

  private getStatusLabel(status: SymptomDayCell['status']): string {
    switch (status) {
      case 'submitted':
        return 'submitted';
      case 'today-submitted':
        return 'submitted today';
      case 'today':
        return 'pending today';
      case 'empty':
        return 'not available';
      default:
        return 'missed';
    }
  }
}
