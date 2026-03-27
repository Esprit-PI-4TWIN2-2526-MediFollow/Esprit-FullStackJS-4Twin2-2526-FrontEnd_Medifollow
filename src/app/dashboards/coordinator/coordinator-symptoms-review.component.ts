import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CoordinatorSymptomsFilter,
  CoordinatorSymptomsResponse,
  CoordinatorSymptomsService
} from '../../services/coordinator-symptoms.service';

@Component({
  selector: 'app-coordinator-symptoms-review',
  templateUrl: './coordinator-symptoms-review.component.html',
  styleUrl: './coordinator-symptoms-review.component.css'
})
export class CoordinatorSymptomsReviewComponent implements OnInit {
  readonly filters: Array<{ key: CoordinatorSymptomsFilter; label: string }> = [
    { key: 'all', label: 'All responses' },
    { key: 'pending', label: 'Pending' },
    { key: 'validated', label: 'Validated' }
  ];

  activeFilter: CoordinatorSymptomsFilter = 'all';
  responses: CoordinatorSymptomsResponse[] = [];
  isLoading = true;
  errorMessage = '';

  constructor(
    private coordinatorSymptomsService: CoordinatorSymptomsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadResponses();
  }

  setFilter(filter: CoordinatorSymptomsFilter): void {
    if (this.activeFilter === filter || this.isLoading) {
      return;
    }

    this.activeFilter = filter;
    this.loadResponses();
  }

  openDetails(response: CoordinatorSymptomsResponse): void {
    this.router.navigate(['/coordinator/symptoms-review', response._id]);
  }

  getStatusLabel(response: CoordinatorSymptomsResponse): string {
    if (response.validated) {
      return response.issueReported ? 'Issue reported' : 'Validated';
    }

    return 'Pending';
  }

  getStatusClasses(response: CoordinatorSymptomsResponse): string {
    if (response.validated) {
      return response.issueReported
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300';
    }

    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-900/20 dark:text-sky-300';
  }

  getVitalsPreview(response: CoordinatorSymptomsResponse): Array<{ key: string; value: string }> {
    return Object.entries(response.vitals).slice(0, 3).map(([key, value]) => ({
      key: this.humanizeKey(key),
      value
    }));
  }

  private loadResponses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.coordinatorSymptomsService.getResponses(this.activeFilter).subscribe({
      next: (responses) => {
        this.responses = responses;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load coordinator symptoms responses.';
        this.isLoading = false;
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

