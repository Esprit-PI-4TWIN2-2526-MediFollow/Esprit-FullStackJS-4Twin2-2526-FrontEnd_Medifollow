import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import {
  DoctorSymptomsService,
  DoctorSymptomsSubmission
} from '../../services/doctor-symptoms.service';

@Component({
  selector: 'app-doctor-view-symptoms',
  templateUrl: './doctor-view-symptoms.component.html',
  styleUrl: './doctor-view-symptoms.component.css'
})
export class DoctorViewSymptomsComponent implements OnInit {
  patientId = '';
  patient: Users | null = null;
  submissions: DoctorSymptomsSubmission[] = [];
  selectedSubmission: DoctorSymptomsSubmission | null = null;
  isLoadingPatient = true;
  isLoadingSymptoms = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private doctorSymptomsService: DoctorSymptomsService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPatient();
    this.loadSymptoms();
  }

  selectSubmission(submission: DoctorSymptomsSubmission): void {
    this.selectedSubmission = submission;
  }

  isSelected(submission: DoctorSymptomsSubmission): boolean {
    return this.selectedSubmission?._id === submission._id;
  }

  getUserInitials(): string {
    const first = this.patient?.firstName?.charAt(0) || '';
    const last = this.patient?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '?';
  }

  goBack(): void {
    this.router.navigate(['/doctor/dashboard']);
  }

  private loadPatient(): void {
    this.usersService.getUserById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoadingPatient = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load patient information.';
        this.isLoadingPatient = false;
      }
    });
  }

  private loadSymptoms(): void {
    this.doctorSymptomsService.getPatientSymptoms(this.patientId).subscribe({
      next: (submissions) => {
        this.submissions = submissions;
        this.selectedSubmission = submissions[0] ?? null;
        this.isLoadingSymptoms = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load symptoms and vital signs.';
        this.isLoadingSymptoms = false;
      }
    });
  }
}

