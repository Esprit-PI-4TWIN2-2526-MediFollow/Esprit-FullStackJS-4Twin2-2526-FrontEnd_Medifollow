import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConsultationService } from '../services/consultation.service';
import { CreateConsultationDto } from '../models/consultation.model';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-consultation',
  templateUrl: './create-consultation.component.html',
  styleUrls: ['./create-consultation.component.css']
})
export class CreateConsultationComponent implements OnInit {
  patients: any[] = [];
  loading = false;
  error: string | null = null;

  // Form data
  selectedPatientId = '';
  consultationType: 'scheduled' | 'urgent' | 'follow-up' = 'scheduled';
  scheduledDate = '';
  scheduledTime = '';
  reason = '';

  currentUserId = '';

  constructor(
    private consultationService: ConsultationService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id; // MongoDB uses _id
    this.loadPatients();

    // Set default date/time to tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.scheduledDate = tomorrow.toISOString().split('T')[0];
    this.scheduledTime = '10:00';
  }

  loadPatients(): void {
    this.http.get<any[]>(`${environment.apiUrl}/api/users/patients`).subscribe({
      next: (data) => {
        this.patients = data;
      },
      error: (err) => {
        console.error('Error loading patients:', err);
      }
    });
  }

  onSubmit(): void {
    if (!this.selectedPatientId || !this.scheduledDate || !this.scheduledTime || !this.reason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#087f8b'
      });
      return;
    }

    const scheduledAt = `${this.scheduledDate}T${this.scheduledTime}:00Z`;

    const dto: CreateConsultationDto = {
      patientId: this.selectedPatientId,
      doctorId: this.currentUserId,
      type: this.consultationType,
      scheduledAt,
      reason: this.reason
    };

    this.loading = true;
    this.error = null;

    this.consultationService.create(dto).subscribe({
      next: (consultation) => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Consultation created successfully',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/telemedicine/consultation', consultation._id]);
        });
      },
      error: (err) => {
        this.error = 'Error creating consultation';
        console.error(err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create consultation',
          confirmButtonColor: '#087f8b'
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/telemedicine/consultations']);
  }
}
