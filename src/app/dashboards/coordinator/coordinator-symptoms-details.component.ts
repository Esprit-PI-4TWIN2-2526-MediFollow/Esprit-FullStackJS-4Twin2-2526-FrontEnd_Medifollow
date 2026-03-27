import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CoordinatorSymptomsResponse,
  CoordinatorSymptomsService
} from '../../services/coordinator-symptoms.service';

@Component({
  selector: 'app-coordinator-symptoms-details',
  templateUrl: './coordinator-symptoms-details.component.html',
  styleUrl: './coordinator-symptoms-details.component.css'
})
export class CoordinatorSymptomsDetailsComponent implements OnInit {
  response: CoordinatorSymptomsResponse | null = null;
  responseId = '';
  note = '';
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coordinatorSymptomsService: CoordinatorSymptomsService
  ) {}

  ngOnInit(): void {
    this.responseId = this.route.snapshot.paramMap.get('responseId') || '';
    this.loadDetails();
  }

  goBack(): void {
    this.router.navigate(['/coordinator/symptoms-review']);
  }

  onNoteInput(event: Event): void {
    this.note = (event.target as HTMLTextAreaElement).value;
  }

  validateResponse(): void {
    if (!this.responseId || this.isSubmitting) {
      return;
    }
    this.submit('validate');
  }

  reportIssue(): void {
    if (!this.responseId || this.isSubmitting) {
      return;
    }
    this.submit('issue');
  }

  get vitalsRows(): Array<{ label: string; value: string }> {
    if (!this.response) {
      return [];
    }

    return Object.entries(this.response.vitals).map(([key, value]) => ({
      label: this.humanizeKey(key),
      value
    }));
  }

  private loadDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.coordinatorSymptomsService.getResponseDetails(this.responseId).subscribe({
      next: (response) => {
        this.response = response;
        this.note = response.validationNote;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load the symptoms response details.';
        this.isLoading = false;
      }
    });
  }

  private submit(action: 'validate' | 'issue'): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = action === 'validate'
      ? this.coordinatorSymptomsService.validateResponse(this.responseId, this.note)
      : this.coordinatorSymptomsService.reportIssue(this.responseId, this.note);

    request.subscribe({
      next: (response) => {
        this.response = response;
        this.note = response.validationNote;
        this.successMessage = action === 'validate'
          ? 'Symptoms response validated successfully.'
          : 'Issue reported successfully.';
        this.isSubmitting = false;
      },
      error: () => {
        this.errorMessage = action === 'validate'
          ? 'Unable to validate this response.'
          : 'Unable to report an issue for this response.';
        this.isSubmitting = false;
      }
    });
  }

  private humanizeKey(value: string): string {
    return value
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (letter) => letter.toUpperCase());
  }
}

