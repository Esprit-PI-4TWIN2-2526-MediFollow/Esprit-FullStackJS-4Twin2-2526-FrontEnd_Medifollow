import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  NurseSymptomsResponse,
  SymptomsNurseService,
} from '../services/symptoms-nurse.service';

type SymptomsFilter = 'all' | 'pending' | 'validated';

@Component({
  selector: 'app-symptoms-list',
  templateUrl: './symptoms-list.component.html',
  styleUrl: './symptoms-list.component.css'
})
export class SymptomsListComponent implements OnInit {
  readonly filters: Array<{ key: SymptomsFilter; label: string }> = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'validated', label: 'Validées' }
  ];

  activeFilter: SymptomsFilter = 'all';
  responses: NurseSymptomsResponse[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private symptomsNurseService: SymptomsNurseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadResponses();
  }

  get pendingResponses(): NurseSymptomsResponse[] {
    return this.responses.filter((response) => !response.validated);
  }

  get validatedResponses(): NurseSymptomsResponse[] {
    return this.responses.filter((response) => !!response.validated);
  }

  get pendingCount(): number {
    return this.pendingResponses.length;
  }

  get filteredResponses(): NurseSymptomsResponse[] {
    if (this.activeFilter === 'pending') {
      return this.pendingResponses;
    }

    if (this.activeFilter === 'validated') {
      return this.validatedResponses;
    }

    return this.responses;
  }

  setFilter(filter: SymptomsFilter): void {
    this.activeFilter = filter;
  }

  openDetails(response: NurseSymptomsResponse): void {
    if (!response._id) {
      return;
    }

    this.router.navigate(['/nurse/symptoms', response._id]);
  }

  trackByResponse(_: number, response: NurseSymptomsResponse): string {
    return response._id;
  }

  formatSubmissionTime(response: NurseSymptomsResponse): string {
    const rawDate = response.submittedAt || response.createdAt || response.updatedAt;
    if (!rawDate) {
      return 'Unknown time';
    }

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown time';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(response: NurseSymptomsResponse): string {
    if (response.validated) {
      return response.issueReported ? 'Problème signalé' : 'Validée';
    }

    return 'En attente';
  }

  getStatusClasses(response: NurseSymptomsResponse): string {
    if (response.validated) {
      return response.issueReported
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300';
    }

    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300';
  }

  getVitalLabel(key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): string {
    if (key === 'bloodPressure') {
      return 'TA';
    }

    if (key === 'heartRate') {
      return 'FC';
    }

    if (key === 'temperature') {
      return 'Temp';
    }

    return 'Poids';
  }

  getVitalDisplayValue(response: NurseSymptomsResponse, key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): string {
    const value = response.vitals?.[key];
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  }

  getVitalChipClasses(response: NurseSymptomsResponse, key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): string {
    const level = this.getVitalLevel(response, key);

    if (level === 'alert') {
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300';
    }

    if (level === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300';
  }

  private loadResponses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.symptomsNurseService.getResponsesForNurse().subscribe({
      next: (responses) => {
        this.responses = responses;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load symptoms responses for nurse', error);
        this.errorMessage = 'Unable to load symptoms responses.';
        this.isLoading = false;
      }
    });
  }

  private getVitalLevel(
    response: NurseSymptomsResponse,
    key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'
  ): 'normal' | 'warning' | 'alert' {
    const rawValue = response.vitals?.[key];
    const numericValue = this.toNumber(rawValue);

    // These thresholds intentionally stay simple so the UI communicates quick triage states.
    if (key === 'bloodPressure') {
      const pressure = String(rawValue || '');
      const [systolicValue, diastolicValue] = pressure.split('/').map((value) => Number(value.trim()));

      if (!Number.isNaN(systolicValue) && !Number.isNaN(diastolicValue)) {
        if (systolicValue >= 140 || diastolicValue >= 90) {
          return 'alert';
        }

        if (systolicValue >= 120 || diastolicValue >= 80) {
          return 'warning';
        }
      }

      return 'normal';
    }

    if (numericValue === null) {
      return 'normal';
    }

    if (key === 'heartRate') {
      if (numericValue < 50 || numericValue > 110) {
        return 'alert';
      }

      if (numericValue < 60 || numericValue > 100) {
        return 'warning';
      }
    }

    if (key === 'temperature') {
      if (numericValue >= 38.5 || numericValue < 35.5) {
        return 'alert';
      }

      if (numericValue >= 37.5) {
        return 'warning';
      }
    }

    if (key === 'weight') {
      if (numericValue >= 120 || numericValue <= 40) {
        return 'alert';
      }

      if (numericValue >= 100 || numericValue <= 45) {
        return 'warning';
      }
    }

    return 'normal';
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

}
