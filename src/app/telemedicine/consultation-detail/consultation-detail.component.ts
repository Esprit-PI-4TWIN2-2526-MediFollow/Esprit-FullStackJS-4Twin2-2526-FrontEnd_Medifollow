import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../services/consultation.service';
import { PrescriptionService } from '../services/prescription.service';
import { MedicalDocumentService } from '../services/medical-document.service';
import { Consultation } from '../models/consultation.model';
import { Prescription } from '../models/prescription.model';
import { MedicalDocument } from '../models/medical-document.model';

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
        this.error = 'Erreur lors du chargement de la consultation';
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
        console.error('Erreur chargement prescriptions:', err);
      }
    });
  }

  loadDocuments(consultationId: string): void {
    this.documentService.findByConsultation(consultationId).subscribe({
      next: (data) => {
        this.documents = data;
      },
      error: (err) => {
        console.error('Erreur chargement documents:', err);
      }
    });
  }

  startConsultation(): void {
    if (!this.consultation) return;

    if (confirm('Démarrer cette consultation? Une fenêtre de vidéoconférence va s\'ouvrir.')) {
      this.consultationService.start(this.consultation._id).subscribe({
        next: (data) => {
          this.consultation = data;
          // Open video meeting
          this.openVideoMeeting();
        },
        error: (err) => {
          alert('Erreur lors du démarrage');
          console.error(err);
        }
      });
    }
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
      alert('Le diagnostic est requis');
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
        alert('Consultation terminée avec succès');
      },
      error: (err) => {
        alert('Erreur lors de la fin de consultation');
        console.error(err);
      }
    });
  }

  cancelConsultation(): void {
    if (!this.consultation) return;

    if (confirm('Annuler cette consultation?')) {
      this.consultationService.cancel(this.consultation._id).subscribe({
        next: (data) => {
          this.consultation = data;
        },
        error: (err) => {
          alert('Erreur lors de l\'annulation');
          console.error(err);
        }
      });
    }
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
      'pending': 'En attente',
      'in-progress': 'En cours',
      'completed': 'Terminée',
      'cancelled': 'Annulée',
      'no-show': 'Absent'
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
