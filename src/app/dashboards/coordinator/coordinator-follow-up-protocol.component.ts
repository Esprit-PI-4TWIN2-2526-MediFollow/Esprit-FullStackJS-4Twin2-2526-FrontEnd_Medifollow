import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CoordinatorFollowUpService,
  CoordinatorProtocolPatient,
  CoordinatorProtocolStatus
} from '../../services/coordinator-follow-up.service';

@Component({
  selector: 'app-coordinator-follow-up-protocol',
  templateUrl: './coordinator-follow-up-protocol.component.html',
  styleUrl: './coordinator-follow-up-protocol.component.css'
})
export class CoordinatorFollowUpProtocolComponent implements OnInit {
  patients: CoordinatorProtocolPatient[] = [];
  searchTerm = '';
  isLoading = true;
  errorMessage = '';

  constructor(
    private coordinatorFollowUpService: CoordinatorFollowUpService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProtocol();
  }

  get filteredPatients(): CoordinatorProtocolPatient[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.patients;
    }

    return this.patients.filter((patient) =>
      patient.patientName.toLowerCase().includes(term)
      || patient.patientEmail.toLowerCase().includes(term)
      || patient.patientDepartment.toLowerCase().includes(term)
    );
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  openDetails(patient: CoordinatorProtocolPatient): void {
    this.router.navigate(['/coordinator/follow-up/protocol', patient.patientId]);
  }

  getStatusClasses(status: CoordinatorProtocolStatus): string {
    return status.done
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300'
      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/20 dark:text-amber-300';
  }

  private loadProtocol(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.coordinatorFollowUpService.getProtocol().subscribe({
      next: (patients) => {
        this.patients = patients;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load the follow-up protocol.';
        this.isLoading = false;
      }
    });
  }
}

