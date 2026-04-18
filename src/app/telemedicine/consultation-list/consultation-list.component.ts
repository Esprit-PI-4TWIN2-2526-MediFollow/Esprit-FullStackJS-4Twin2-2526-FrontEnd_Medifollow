import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConsultationService } from '../services/consultation.service';
import { Consultation } from '../models/consultation.model';

@Component({
  selector: 'app-consultation-list',
  templateUrl: './consultation-list.component.html',
  styleUrls: ['./consultation-list.component.css']
})
export class ConsultationListComponent implements OnInit {
  consultations: Consultation[] = [];
  filteredConsultations: Consultation[] = [];
  loading = false;
  error: string | null = null;
  
  // Filters
  statusFilter: string = 'all';
  searchTerm: string = '';
  
  // User info (get from auth service)
  currentUserId: string = '';
  currentUserRole: string = '';

  constructor(
    private consultationService: ConsultationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = user._id; // MongoDB uses _id
    this.currentUserRole = typeof user.role === 'string' ? user.role : user.role?.name || '';
    
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;
    this.error = null;

    let observable;
    if (this.currentUserRole === 'doctor' || this.currentUserRole === 'DOCTOR') {
      observable = this.consultationService.findByDoctor(this.currentUserId);
    } else if (this.currentUserRole === 'patient') {
      observable = this.consultationService.findByPatient(this.currentUserId);
    } else {
      observable = this.consultationService.findAll();
    }

    observable.subscribe({
      next: (data) => {
        this.consultations = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des consultations';
        console.error(err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredConsultations = this.consultations.filter(consultation => {
      const matchesStatus = this.statusFilter === 'all' || consultation.status === this.statusFilter;
      const matchesSearch = !this.searchTerm || 
        consultation.patient.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        consultation.patient.lastName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        consultation.doctor.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        consultation.doctor.lastName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  viewConsultation(id: string): void {
    this.router.navigate(['/telemedicine/consultation', id]);
  }

  createConsultation(): void {
    this.router.navigate(['/telemedicine/create-consultation']);
  }

  startConsultation(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Démarrer cette consultation?')) {
      this.consultationService.start(id).subscribe({
        next: () => {
          this.loadConsultations();
        },
        error: (err) => {
          alert('Erreur lors du démarrage de la consultation');
          console.error(err);
        }
      });
    }
  }

  cancelConsultation(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Annuler cette consultation?')) {
      this.consultationService.cancel(id).subscribe({
        next: () => {
          this.loadConsultations();
        },
        error: (err) => {
          alert('Erreur lors de l\'annulation de la consultation');
          console.error(err);
        }
      });
    }
  }

  joinVideoConsultation(consultationId: string, event: Event): void {
    event.stopPropagation();
    
    // Generate unique room name based on consultation ID
    const roomName = `medifollow-${consultationId}`;
    
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

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'scheduled': 'Programmée',
      'urgent': 'Urgente',
      'follow-up': 'Suivi'
    };
    return labels[type] || type;
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
}
