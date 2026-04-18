import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrescriptionService } from '../services/prescription.service';
import { Medication, CreatePrescriptionDto } from '../models/prescription.model';

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
      alert('Veuillez remplir tous les champs du médicament');
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
      alert('Ajoutez au moins un médicament');
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
        alert('Prescription créée avec succès!');
        this.router.navigate(['/telemedicine/consultation', this.consultationId]);
      },
      error: (err) => {
        this.error = 'Erreur lors de la création de la prescription';
        console.error(err);
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/telemedicine/consultation', this.consultationId]);
  }
}
