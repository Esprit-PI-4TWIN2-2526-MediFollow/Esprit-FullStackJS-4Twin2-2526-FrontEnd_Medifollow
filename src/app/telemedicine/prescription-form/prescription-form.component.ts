import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionService } from '../services/prescription.service';
import { Medication, CreatePrescriptionDto } from '../models/prescription.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-prescription-form',
  templateUrl: './prescription-form.component.html',
  styleUrls: ['./prescription-form.component.css']
})
export class PrescriptionFormComponent implements OnInit {
  consultationId = '';
  medications: Medication[] = [];
  pharmacyNotes = '';
  loading = false;
  error: string | null = null;

  // New medication form
  newMed: Medication = {
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService
  ) {}

  ngOnInit(): void {
    this.consultationId = this.route.snapshot.paramMap.get('consultationId') || '';
  }

  addMedication(): void {
    if (!this.newMed.name || !this.newMed.dosage || !this.newMed.frequency || !this.newMed.duration) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please fill in all medication fields',
        confirmButtonColor: '#087f8b'
      });
      return;
    }

    this.medications.push({ ...this.newMed });
    this.newMed = {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
  }

  removeMedication(index: number): void {
    this.medications.splice(index, 1);
  }

  onSubmit(): void {
    if (this.medications.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Medications',
        text: 'Add at least one medication',
        confirmButtonColor: '#087f8b'
      });
      return;
    }

    const dto: CreatePrescriptionDto = {
      consultationId: this.consultationId,
      medications: this.medications,
      pharmacyNotes: this.pharmacyNotes
    };

    this.loading = true;
    this.error = null;

    this.prescriptionService.create(dto).subscribe({
      next: (prescription) => {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Prescription created successfully',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.router.navigate(['/telemedicine/consultation', this.consultationId]);
        });
      },
      error: (err) => {
        this.error = 'Error creating prescription';
        console.error(err);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create prescription',
          confirmButtonColor: '#087f8b'
        });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/telemedicine/consultation', this.consultationId]);
  }
}
