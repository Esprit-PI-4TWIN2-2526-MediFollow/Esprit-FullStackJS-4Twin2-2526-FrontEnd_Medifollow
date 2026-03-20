import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import { QuestionnaireService } from '../../services/questionnaire.service';
import { Questionnaire } from '../../models/questionnaire';

@Component({
  selector: 'app-dashboard-physician',
  templateUrl: './dashboard-physician.component.html',
  styleUrl: './dashboard-physician.component.css'
})
export class DashboardPhysicianComponent implements OnInit {

  currentDoctor: Users | null = null;
  patients: Users[] = [];
  isLoadingPatients = true;
  errorMessage = '';
  today = new Date();

  // Search + filter
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;

  // Responses count per patient
  responsesCountMap: Record<string, number> = {};

// ── Propriétés à ajouter ────────────────────────────────
questionnaires: Questionnaire[] = [];
isLoadingQuestionnaires = false;

  constructor(
    private usersService: UsersService,
    private questionnaireService: QuestionnaireService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentDoctor();
  }

get activeCount(): number {
  return this.patients.filter(p => p.actif).length;
}

get inactiveCount(): number {
  return this.patients.filter(p => !p.actif).length;
}

  // ── Load current doctor ─────────────────────────────────

  loadCurrentDoctor(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const localUser = JSON.parse(userStr);
      this.usersService.getUserByEmail(localUser.email).subscribe({
        next: (doctor) => {
          this.currentDoctor = doctor;
          this.loadPatients(doctor.firstName + ' ' + doctor.lastName);
          this.loadQuestionnaires(doctor.assignedDepartment);

        },
        error: (err) => {
          console.error('Error loading doctor:', err);
          this.isLoadingPatients = false;
        }
      });
    } catch (e) {
      console.error('Error parsing user:', e);
      this.isLoadingPatients = false;
    }
  }

  // ── Load patients assigned to this doctor ───────────────

  loadPatients(doctorFullName: string): void {
    this.isLoadingPatients = true;
    this.usersService.getUsers().subscribe({
      next: (users) => {
        // Filtrer les patients dont primaryDoctor = nom du médecin connecté
        this.patients = users.filter(
          u => u.primaryDoctor === doctorFullName
        );
        this.isLoadingPatients = false;
        // Charger le nb de réponses pour chaque patient
        this.patients.forEach(p => this.loadResponsesCount(p._id));
      },
      error: () => {
        this.errorMessage = 'Failed to load patients.';
        this.isLoadingPatients = false;
      }
    });
  }

  loadResponsesCount(patientId: string): void {
    this.questionnaireService.getPatientResponses(patientId).subscribe({
      next: (responses) => {
        this.responsesCountMap[patientId] = responses.length;
      }
    });
  }
//load questionnaires assigned to the same service of  a doctor
loadQuestionnaires(service: string): void {
  this.isLoadingQuestionnaires = true;
  this.questionnaireService.getAll(service).subscribe({
    next: (data) => {
      this.questionnaires = data.filter(q => q.status === 'active');
      this.isLoadingQuestionnaires = false;
    },
    error: () => {
      this.isLoadingQuestionnaires = false;
    }
  });
}

viewQuestionnaire(id: string): void {
  this.router.navigate(['/questionnaire/view', id]);
}
  // ── Search + Filter for patients ─────────────────────────────────────

  get filteredPatients(): Users[] {
    return this.patients.filter(p => {
      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchSearch = fullName.includes(this.searchTerm.toLowerCase())
        || p.email?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus =
        this.statusFilter === 'all'
        || (this.statusFilter === 'active' && p.actif)
        || (this.statusFilter === 'inactive' && !p.actif);
      return matchSearch && matchStatus;
    });
  }

// ── Questionnaire filter ────────────────────────────────
questionnaireSearch = '';
questionnaireStatusFilter: 'all' | 'active' | 'inactive' = 'all';

get filteredQuestionnaires() {
  return this.questionnaires.filter(q => {
    const matchSearch = q.title.toLowerCase()
      .includes(this.questionnaireSearch.toLowerCase());
    const matchStatus =
      this.questionnaireStatusFilter === 'all'
      || q.status === this.questionnaireStatusFilter;
    return matchSearch && matchStatus;
  });
}

onQuestionnaireSearch(event: Event): void {
  this.questionnaireSearch = (event.target as HTMLInputElement).value;
}
  // ── Pagination ──────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginatedPatients(): Users[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPatients.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
  }

  // ── Navigation ──────────────────────────────────────────

  viewPatientResponses(patientId: string): void {
    this.router.navigate(['/physician/patient', patientId, 'responses']);
  }

  // ── Helpers ─────────────────────────────────────────────

  getUserInitials(user: Users): string {
    const f = user.firstName?.charAt(0) || '';
    const l = user.lastName?.charAt(0) || '';
    return (f + l).toUpperCase();
  }

  getResponsesCount(patientId: string): number {
    return this.responsesCountMap[patientId] || 0;
  }

  getWelcomeName(): string {
    return this.currentDoctor?.firstName?.trim() || 'Doctor';
  }
}
