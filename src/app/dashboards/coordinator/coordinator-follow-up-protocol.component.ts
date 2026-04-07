import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  CoordinatorFollowUpService,
  CoordinatorProtocolPatient,
  CoordinatorProtocolStatus
} from '../../services/coordinator-follow-up.service';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { from, mergeMap, of, toArray } from 'rxjs';

@Component({
  selector: 'app-coordinator-follow-up-protocol',
  templateUrl: './coordinator-follow-up-protocol.component.html',
  styleUrl: './coordinator-follow-up-protocol.component.css'
})
export class CoordinatorFollowUpProtocolComponent implements OnInit {
  patients: CoordinatorProtocolPatient[] = [];
  searchTerm = '';
  isLoading = true;
  isLoadingQuestionnaireStatus = false;
  errorMessage = '';

  constructor(
    private coordinatorFollowUpService: CoordinatorFollowUpService,
    private questionnaireService: QuestionnaireService,
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

  getStatus(patient: CoordinatorProtocolPatient, key: CoordinatorProtocolStatus['key']): CoordinatorProtocolStatus {
    return patient.statuses.find((status) => status.key === key)
      ?? { key, label: key, done: false };
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
        this.hydrateQuestionnaireStatuses();
      },
      error: () => {
        this.errorMessage = 'Unable to load the follow-up protocol.';
        this.isLoading = false;
      }
    });
  }

  private hydrateQuestionnaireStatuses(): void {
    if (this.patients.length === 0) {
      return;
    }

    // The follow-up endpoint can be stale. Compute questionnaire submissions from the real responses API.
    this.isLoadingQuestionnaireStatus = true;

    from(this.patients).pipe(
      mergeMap((patient) => {
        if (!patient.patientId) {
          return of({ patientId: '', count: 0 });
        }

        return this.questionnaireService.getPatientResponses(patient.patientId).pipe(
          mergeMap((responses) => of({ patientId: patient.patientId, count: Array.isArray(responses) ? responses.length : 0 })),
        );
      }, 6),
      toArray()
    ).subscribe({
      next: (results) => {
        const counts = results.reduce<Record<string, number>>((accumulator, item) => {
          if (item.patientId) {
            accumulator[item.patientId] = item.count;
          }
          return accumulator;
        }, {});

        this.patients = this.patients.map((patient) => {
          const submissionsCount = counts[patient.patientId] ?? null;
          const statuses = patient.statuses.map((status) => {
            if (status.key !== 'questionnaireCompleted') {
              return status;
            }

            if (submissionsCount === null) {
              return status;
            }

            // Mark done if at least one submission exists. This keeps the list consistent with actual data.
            return { ...status, done: submissionsCount > 0 };
          });

          return { ...patient, statuses };
        });

        this.isLoadingQuestionnaireStatus = false;
      },
      error: () => {
        this.isLoadingQuestionnaireStatus = false;
      }
    });
  }
}

