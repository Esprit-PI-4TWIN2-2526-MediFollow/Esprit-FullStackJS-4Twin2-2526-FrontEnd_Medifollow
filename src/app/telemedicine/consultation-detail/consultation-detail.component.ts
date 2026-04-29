import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../services/consultation.service';
import { PrescriptionService } from '../services/prescription.service';
import { MedicalDocumentService } from '../services/medical-document.service';
import { Consultation } from '../models/consultation.model';
import { Prescription } from '../models/prescription.model';
import { MedicalDocument } from '../models/medical-document.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-consultation-detail',
  templateUrl: './consultation-detail.component.html',
  styleUrls: ['./consultation-detail.component.css']
})
export class ConsultationDetailComponent implements OnInit {
  consultation: Consultation | null = null;
  prescriptions: Prescription[] = [];
  documents: MedicalDocument[] = [];
  loading = false;
  error: string | null = null;

  // Current user
  currentUserId: string = '';
  currentUserRole: string = '';

  // Tabs
  activeTab: 'details' | 'prescriptions' | 'documents' = 'details';

  // End consultation form
  showEndForm = false;
  endNotes = '';
  endDiagnosis = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private prescriptionService: PrescriptionService,
    private documentService: MedicalDocumentService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id; // MongoDB uses _id
    this.currentUserRole = typeof user.role === 'string' ? user.role : user.role?.name || '';

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadConsultation(id);
    }
  }

  loadConsultation(id: string): void {
    this.loading = true;
    this.error = null;

    this.consultationService.findOne(id).subscribe({
      next: (data) => {
        this.consultation = data;
        this.loading = false;
        this.loadPrescriptions(id);
        this.loadDocuments(id);
      },
      error: (err) => {
        this.error = 'Error loading consultation';
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadPrescriptions(consultationId: string): void {
    this.prescriptionService.findByConsultation(consultationId).subscribe({
      next: (data) => {
        this.prescriptions = data;
      },
      error: (err) => {
        console.error('Error loading prescriptions:', err);
      }
    });
  }

  loadDocuments(consultationId: string): void {
    this.documentService.findByConsultation(consultationId).subscribe({
      next: (data) => {
        this.documents = data;
      },
      error: (err) => {
        console.error('Error loading documents:', err);
      }
    });
  }

  startConsultation(): void {
    if (!this.consultation) return;

    Swal.fire({
      title: 'Start Consultation?',
      text: 'A video conference window will open',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#087f8b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, start it!'
    }).then((result) => {
      if (result.isConfirmed && this.consultation) {
        this.consultationService.start(this.consultation._id).subscribe({
          next: (data) => {
            this.consultation = data;
            this.openVideoMeeting();
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error starting consultation',
              confirmButtonColor: '#087f8b'
            });
            console.error(err);
          }
        });
      }
    });
  }

  openVideoMeeting(): void {
    if (!this.consultation) return;

    // Generate unique room name based on consultation ID
    const roomName = `medifollow-${this.consultation._id}`;
    
    // Create Jitsi Meet URL
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    
    // Get user info for display name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    
    // Build full URL with parameters
    const fullUrl = `${jitsiUrl}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(displayName)}"`;
    
    // Open in new window
    const width = 1200;
    const height = 800;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(
      fullUrl,
      'VideoConsultation',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }

  openEndForm(): void {
    this.showEndForm = true;
  }

  closeEndForm(): void {
    this.showEndForm = false;
    this.endNotes = '';
    this.endDiagnosis = '';
  }

  endConsultation(): void {
    if (!this.consultation) return;

    if (!this.endDiagnosis.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Diagnosis',
        text: 'Diagnosis is required',
        confirmButtonColor: '#087f8b'
      });
      return;
    }

    this.consultationService.end(
      this.consultation._id,
      this.endNotes,
      this.endDiagnosis
    ).subscribe({
      next: (data) => {
        this.consultation = data;
        this.closeEndForm();
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Consultation ended successfully',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error ending consultation',
          confirmButtonColor: '#087f8b'
        });
        console.error(err);
      }
    });
  }

  cancelConsultation(): void {
    if (!this.consultation) return;

    Swal.fire({
      title: 'Cancel Consultation?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f04438',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
      if (result.isConfirmed && this.consultation) {
        this.consultationService.cancel(this.consultation._id).subscribe({
          next: (data) => {
            this.consultation = data;
            Swal.fire({
              icon: 'success',
              title: 'Cancelled',
              text: 'Consultation has been cancelled',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Error cancelling consultation',
              confirmButtonColor: '#087f8b'
            });
            console.error(err);
          }
        });
      }
    });
  }

  createPrescription(): void {
    if (!this.consultation) return;
    this.router.navigate(['/telemedicine/prescription/create', this.consultation._id]);
  }

  uploadDocument(): void {
    if (!this.consultation) return;
    this.router.navigate(['/telemedicine/document/upload', this.consultation._id]);
  }

  viewPrescription(id: string): void {
    this.router.navigate(['/telemedicine/prescription', id]);
  }

  viewDocument(doc: MedicalDocument): void {
    window.open(doc.fileUrl, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/telemedicine/consultations']);
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
      'no-show': 'No Show'
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  getDocumentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'lab-result': '🧪',
      'imaging': '🔬',
      'report': '📄',
      'prescription': '💊',
      'other': '📎'
    };
    return icons[type] || '📎';
  }

  isDoctor(): boolean {
    return this.currentUserRole === 'doctor' || this.currentUserRole === 'DOCTOR';
  }
}
