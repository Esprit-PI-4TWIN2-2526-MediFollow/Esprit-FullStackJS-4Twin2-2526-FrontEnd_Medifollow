import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { UsersService } from '../../services/user/users.service';
import { Users } from '../../models/users';
import { Questionnaire } from '../../models/questionnaire';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { QuestionnaireResponsePopulated } from '../../models/questionnaire-response';
import { SymptomAssignedForm, SymptomDayCell, SymptomResponse } from './symptoms-response.model';
import { SymptomsResponseService } from './symptoms-response.service';

@Component({
  selector: 'app-dashboard-patient',
  templateUrl: './dashboard-patient.component.html',
  styleUrl: './dashboard-patient.component.css'
})
export class DashboardPatientComponent implements OnInit {

  currentUser: Users | null = null;
  today = new Date();
  daysTimeline: SymptomDayCell[] = [];
  timelineCurrentDay = 0;
  timelineTotalDays = 0;
  daysRemaining = 0;

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
      symptomForm: this.symptomsResponseService.getAssignedForm(user._id).pipe(
        catchError(() => of(null as SymptomAssignedForm | null))
      ),
      symptomResponses: this.symptomsResponseService.getPatientResponses(user._id).pipe(
        catchError(() => of([] as SymptomResponse[]))
      )
    }).subscribe({
      next: ({ completedResponses, symptomForm, symptomResponses }) => {
        this.completedIds = completedResponses.map(response =>
          typeof response.questionnaireId === 'object'
            ? response.questionnaireId._id
            : response.questionnaireId as string
        );

        this.initializeSymptomsTimeline(symptomForm, user.createdAt, symptomResponses);
      },
      error: () => {
        this.completedIds = [];
        this.initializeSymptomsTimeline(null, user.createdAt, []);
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

  get submittedDayIndices(): number[] {
    return this.daysTimeline
      .map((d, i) => ({ status: d.status, day: i + 1 }))
      .filter(d => d.status === 'submitted')
      .map(d => d.day);
  }

  get missedDayIndices(): number[] {
    return this.daysTimeline
      .map((d, i) => ({ status: d.status, day: i + 1 }))
      .filter(d => d.status === 'missed')
      .map(d => d.day);
  }

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

  goToSymptomsHistory(date: Date): void {
    if (!date) return;
    this.router.navigate(['/patient/symptoms-history', this.toDateKey(date)]);
  }

  private initializeSymptomsTimeline(
    form: SymptomAssignedForm | null,
    fallbackStartDate: string | Date,
    responses: SymptomResponse[]
  ): void {
    this.daysTimeline = this.generateDaysTimeline(form, fallbackStartDate, responses);
    this.timelineTotalDays = this.daysTimeline.length;

    if (!form?.durationInDays || this.timelineTotalDays === 0) {
      this.timelineCurrentDay = 0;
      this.daysRemaining = 0;
      return;
    }

    const startDate = this.resolveSymptomsStartDate(form, fallbackStartDate);
    const today = this.startOfDay(this.today);
    const elapsedDays = Math.floor((today.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    this.timelineCurrentDay = today < startDate ? 0 : Math.min(this.timelineTotalDays, elapsedDays + 1);
    this.daysRemaining = today < startDate
      ? this.timelineTotalDays
      : Math.max(this.timelineTotalDays - elapsedDays, 0);
  }

  private generateDaysTimeline(
    form: SymptomAssignedForm | null,
    fallbackStartDate: string | Date,
    responses: SymptomResponse[]
  ): SymptomDayCell[] {
    const durationInDays = Number(form?.durationInDays);
    if (!Number.isInteger(durationInDays) || durationInDays <= 0) {
      return [];
    }

    const startDate = this.resolveSymptomsStartDate(form, fallbackStartDate);
    const today = this.startOfDay(this.today);
    const submittedDays = new Set(
      responses
        .map(response => this.extractResponseDate(response))
        .filter((value): value is string => value !== null)
    );

    return Array.from({ length: durationInDays }, (_, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + index);

      const dateKey = this.toDateKey(dayDate);
      const isToday = dateKey === this.toDateKey(today);
      const hasSubmission = submittedDays.has(dateKey);
      const status = isToday
        ? 'today'
        : dayDate < today
          ? (hasSubmission ? 'submitted' : 'missed')
          : 'future';

      return {
        date: dayDate,
        status,
        tooltip: `${this.formatTooltipDate(dayDate)} - ${this.getStatusLabel(status, hasSubmission)}`,
        submitted: hasSubmission,
        isToday
      };
    });
  }

  getTimelineCellClasses(day: SymptomDayCell): string[] {
    if (day.status === 'future') {
      return [
        'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700',
        'cursor-not-allowed opacity-70',
      ];
    }

    if (day.status === 'today') {
      const base = day.submitted
        ? 'bg-green-500 border-green-500'
        : 'bg-red-400 border-red-400';

      return [
        base,
        'ring-2 ring-brand-300 ring-offset-1 dark:ring-brand-700',
        'cursor-pointer',
      ];
    }

    if (day.status === 'submitted') {
      return ['bg-green-500 border-green-500', 'cursor-pointer'];
    }

    return ['bg-red-400 border-red-400', 'cursor-pointer'];
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

  private getStatusLabel(status: SymptomDayCell['status'], submitted = false): string {
    switch (status) {
      case 'submitted':
        return 'submitted';
      case 'today':
        return submitted ? 'submitted today' : 'today';
      case 'future':
        return 'future';
      default:
        return 'missed';
    }
  }

  private resolveSymptomsStartDate(form: SymptomAssignedForm | null, fallbackStartDate: string | Date): Date {
    const sourceDate = form?.startDate ?? form?.assignedAt ?? form?.createdAt ?? fallbackStartDate;
    const parsedDate = new Date(sourceDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return this.startOfDay(this.today);
    }

    return this.startOfDay(parsedDate);
  }
}
