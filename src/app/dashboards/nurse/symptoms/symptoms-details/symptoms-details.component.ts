import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NurseSymptomsResponse,
  SymptomsNurseService,
} from '../services/symptoms-nurse.service';

@Component({
  selector: 'app-symptoms-details',
  templateUrl: './symptoms-details.component.html',
  styleUrl: './symptoms-details.component.css'
})
export class SymptomsDetailsComponent implements OnInit {
  response: NurseSymptomsResponse | null = null;
  responseId = '';
  validationNote = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private symptomsNurseService: SymptomsNurseService
  ) {}

  ngOnInit(): void {
    this.responseId = this.route.snapshot.paramMap.get('responseId') || '';
    this.loadResponseDetails();
  }

  get isReadOnly(): boolean {
    return !!this.response?.validated;
  }

  get answerRows(): Array<{ label: string; value: string }> {
    const answers = this.response?.answers || [];

    return answers.map((answer) => ({
      label: String(answer.question || answer.label || 'Question'),
      value: this.formatAnswerValue(answer.answer ?? answer.value)
    }));
  }

  goBack(): void {
    this.router.navigate(['/nurse/symptoms']);
  }

  onNoteInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.validationNote = target?.value || '';
  }

  validateResponse(): void {
    if (!this.responseId || this.isReadOnly || this.isSubmitting) {
      return;
    }

    this.submitAction('validate');
  }

  signalProblem(): void {
    if (!this.responseId || this.isReadOnly || this.isSubmitting) {
      return;
    }

    this.submitAction('signal');
  }

  formatSubmissionTime(value: string | Date | null | undefined): string {
    if (!value) {
      return 'Unknown time';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown time';
    }

    return date.toLocaleString([], {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getVitalDisplayValue(key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): string {
    const value = this.response?.vitals?.[key];
    return value === null || value === undefined || value === '' ? '—' : String(value);
  }

  getVitalToneClasses(key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): string {
    const level = this.getVitalLevel(key);

    if (level === 'alert') {
      return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300';
    }

    if (level === 'warning') {
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300';
  }

  getVitalStatusLabel(key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): string {
    const level = this.getVitalLevel(key);
    if (level === 'alert') {
      return 'Alert';
    }

    if (level === 'warning') {
      return 'Warning';
    }

    return 'Normal';
  }

  private loadResponseDetails(): void {
    if (!this.responseId) {
      this.errorMessage = 'Symptoms response not found.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.symptomsNurseService.getResponseDetails(this.responseId).subscribe({
      next: (response) => {
        this.response = response;
        this.validationNote = response.validationNote || '';
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load symptoms response details', error);
        this.errorMessage = 'Unable to load the symptoms response details.';
        this.isLoading = false;
      }
    });
  }

  private submitAction(action: 'validate' | 'signal'): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = action === 'validate'
      ? this.symptomsNurseService.validateResponse(this.responseId, this.validationNote)
      : this.symptomsNurseService.signalProblem(this.responseId, this.validationNote);

    request.subscribe({
      next: (response) => {
        this.response = response;
        this.validationNote = response.validationNote || this.validationNote;
        this.successMessage = action === 'validate'
          ? 'Response validated successfully.'
          : 'Problem reported successfully.';
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Failed to update symptoms response', error);
        this.errorMessage = action === 'validate'
          ? 'Unable to validate this response.'
          : 'Unable to signal a problem for this response.';
        this.isSubmitting = false;
      }
    });
  }

  private formatAnswerValue(value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (value === null || value === undefined || value === '') {
      return 'No answer provided';
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return String(value);
  }

  private getVitalLevel(key: 'bloodPressure' | 'heartRate' | 'temperature' | 'weight'): 'normal' | 'warning' | 'alert' {
    const rawValue = this.response?.vitals?.[key];

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

    const numericValue = this.toNumber(rawValue);
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
