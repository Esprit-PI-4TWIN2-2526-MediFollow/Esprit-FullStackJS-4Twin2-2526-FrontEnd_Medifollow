import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CoordinatorFollowUpService,
  CoordinatorProtocolDetails,
  CoordinatorProtocolStatus
} from '../../services/coordinator-follow-up.service';

@Component({
  selector: 'app-coordinator-protocol-details',
  templateUrl: './coordinator-protocol-details.component.html',
  styleUrl: './coordinator-protocol-details.component.css'
})
export class CoordinatorProtocolDetailsComponent implements OnInit {
  details: CoordinatorProtocolDetails | null = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coordinatorFollowUpService: CoordinatorFollowUpService
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
      },
      error: () => {
        this.errorMessage = 'Unable to load protocol details.';
        this.isLoading = false;
      }
    });
  }
}

