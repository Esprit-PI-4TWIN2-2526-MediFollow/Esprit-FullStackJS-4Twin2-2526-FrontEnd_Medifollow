import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import { QuestionnaireResponsePopulated } from '../../models/questionnaire-response';
import { Questionnaire } from '../../models/questionnaire';
import { QuestionnaireService } from '../../services/questionnaire.service';

@Component({
  selector: 'app-dashboard-physician',
  templateUrl: './dashboard-physician.component.html',
  styleUrl: './dashboard-physician.component.css'
})
export class DashboardPhysicianComponent implements OnInit {

  currentDoctor: Users | null = null;
  patients: Users[] = [];
  questionnaires: Questionnaire[] = [];
  allResponses: QuestionnaireResponsePopulated[] = [];

  isLoadingPatients = true;
  isLoadingQuestionnaires = false;
  isLoadingStats = false;
  errorMessage = '';
  today = new Date();

  // Search + filter patients
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Search + filter questionnaires
  questionnaireSearch = '';
  questionnaireStatusFilter: 'all' | 'active' | 'inactive' = 'all';

  // Pagination
  currentPage = 1;
currentPageQuestionnaire=1;
  itemsPerPage = 4;

  // Responses count per patient
  responsesCountMap: Record<string, number> = {};

  // ── Charts ───────────────────────────────────────────────

  genderChartData: ChartData<'doughnut'> = {
    labels: ['Male', 'Female'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#378ADD', '#1D9E75'],
      borderWidth: 0,
    }]
  };

  genderChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 16, font: { size: 12 } }
      }
    },
    cutout: '70%'
  };

  ageChartData: ChartData<'bar'> = {
    labels: ['0-18', '19-30', '31-45', '46-60', '60+'],
    datasets: [{
      label: 'Patients',
      data: [0, 0, 0, 0, 0],
      backgroundColor: '#1D9E75',
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  ageChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false } }
    }
  };

  trendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Responses',
      data: [],
      borderColor: '#1D9E75',
      backgroundColor: 'rgba(29,158,117,0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#1D9E75',
      pointRadius: 4,
    }]
  };

  trendChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: { grid: { display: false } }
    }
  };

  constructor(
    private usersService: UsersService,
    private questionnaireService: QuestionnaireService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentDoctor();
  }

  // ── Load ────────────────────────────────────────────────

  loadCurrentDoctor(): void {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const localUser = JSON.parse(userStr);
      this.usersService.getUserByEmail(localUser.email).subscribe({
        next: (doctor) => {
          this.currentDoctor = doctor;
          this.loadPatients(doctor.firstName + ' ' + doctor.lastName);
          const service = doctor.assignedDepartment || doctor.specialization || '';
          if (service) this.loadQuestionnaires(service);
        },
        error: () => { this.isLoadingPatients = false; }
      });
    } catch (e) { this.isLoadingPatients = false; }
  }

  loadPatients(doctorFullName: string): void {
    this.isLoadingPatients = true;
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.patients = users.filter(u => u.primaryDoctor === doctorFullName);
        this.isLoadingPatients = false;
        this.patients.forEach(p => this.loadResponsesCount(p._id));
        this.buildGenderChart();
        this.buildAgeChart();
        this.loadAllResponses();
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

  loadQuestionnaires(service: string): void {
    this.isLoadingQuestionnaires = true;
    this.questionnaireService.getAll(service).subscribe({
      next: (data) => {
        this.questionnaires = data.filter(q => q.status === 'active');
        this.isLoadingQuestionnaires = false;
      },
      error: () => { this.isLoadingQuestionnaires = false; }
    });
  }

  loadAllResponses(): void {
    this.isLoadingStats = true;
    let loaded = 0;
    if (this.patients.length === 0) {
      this.isLoadingStats = false;
      this.buildTrendChart();
      return;
    }
    this.patients.forEach(p => {
      this.questionnaireService.getPatientResponses(p._id).subscribe({
        next: (responses) => {
          this.allResponses = [...this.allResponses, ...responses];
          loaded++;
          if (loaded === this.patients.length) {
            this.isLoadingStats = false;
            this.buildTrendChart();
          }
        },
        error: () => {
          loaded++;
          if (loaded === this.patients.length) {
            this.isLoadingStats = false;
            this.buildTrendChart();
          }
        }
      });
    });
  }

  // ── Charts builders ─────────────────────────────────────

  buildGenderChart(): void {
    const male   = this.patients.filter(p =>
      ['male', 'homme', 'm'].includes(p.sexe?.toLowerCase() || '')).length;
    const female = this.patients.filter(p =>
      ['female', 'femme', 'f'].includes(p.sexe?.toLowerCase() || '')).length;
    const other  = this.patients.length - male - female;

    this.genderChartData = {
      ...this.genderChartData,
      datasets: [{
        ...this.genderChartData.datasets[0],
        data: [male, female, other]
      }]
    };
  }

  buildAgeChart(): void {
    const groups = [0, 0, 0, 0, 0];
    const now = new Date();
    this.patients.forEach(p => {
      if (!p.dateOfBirth) return;
      const age = now.getFullYear() - new Date(p.dateOfBirth).getFullYear();
      if (age <= 18)      groups[0]++;
      else if (age <= 30) groups[1]++;
      else if (age <= 45) groups[2]++;
      else if (age <= 60) groups[3]++;
      else                groups[4]++;
    });
    this.ageChartData = {
      ...this.ageChartData,
      datasets: [{
        ...this.ageChartData.datasets[0],
        data: groups
      }]
    };
  }

  buildTrendChart(): void {
    const weeks: Record<string, number> = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const label = d.toLocaleDateString('en-US',
        { month: 'short', day: 'numeric' });
      weeks[label] = 0;
    }
    this.allResponses.forEach(r => {
      if (!r.createdAt) return;
      const date = new Date(r.createdAt);
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        if (date >= weekStart && date < weekEnd) {
          const label = weekStart.toLocaleDateString('en-US',
            { month: 'short', day: 'numeric' });
          if (weeks[label] !== undefined) weeks[label]++;
          break;
        }
      }
    });
    this.trendChartData = {
      labels: Object.keys(weeks),
      datasets: [{
        ...this.trendChartData.datasets[0],
        data: Object.values(weeks)
      }]
    };
  }

  // ── Stats getters ───────────────────────────────────────

  get totalResponses(): number {
    return this.allResponses.length;
  }

  get complianceRate(): number {
    if (this.patients.length === 0 || this.questionnaires.length === 0) return 0;
    const expected = this.patients.length * this.questionnaires.length;
    return Math.round((this.totalResponses / expected) * 100);
  }

  get patientsWithNoResponse(): number {
    return this.patients.filter(p =>
      !this.allResponses.some(r => {
        const pid = typeof r.patientId === 'object'
          ? r.patientId._id : r.patientId as string;
        return pid === p._id;
      })
    ).length;
  }

  get patientsWithResponse(): number {
    return this.patients.length - this.patientsWithNoResponse;
  }

  get lastResponseDate(): Date | null {
    if (this.allResponses.length === 0) return null;
    const sorted = [...this.allResponses].sort((a, b) =>
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
    return sorted[0].createdAt ? new Date(sorted[0].createdAt) : null;
  }

  get responsesThisWeek(): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.allResponses.filter(r =>
      r.createdAt && new Date(r.createdAt) >= oneWeekAgo
    ).length;
  }

  get activeCount(): number {
    return this.patients.filter(p => p.actif).length;
  }

  get inactiveCount(): number {
    return this.patients.filter(p => !p.actif).length;
  }

  // ── Filters ─────────────────────────────────────────────

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

  get filteredQuestionnaires(): Questionnaire[] {
    return this.questionnaires.filter(q => {
      const matchSearch = q.title.toLowerCase()
        .includes(this.questionnaireSearch.toLowerCase());
      const matchStatus =
        this.questionnaireStatusFilter === 'all'
        || q.status === this.questionnaireStatusFilter;
      return matchSearch && matchStatus;
    });
  }

//____pagination Patient et Questionnaire__________________________________________________________________

  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.itemsPerPage);
  }

get totalPagesQuestionnaire(): number {
    return Math.ceil(this.filteredQuestionnaires.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

get totalPagesArrayQu(): number[] {
    return Array.from({ length: this.totalPagesQuestionnaire }, (_, i) => i + 1);
  }

  get paginatedPatients(): Users[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredPatients.slice(start, start + this.itemsPerPage);
  }

get paginatedQuestionnaires(): Questionnaire[] {
    const start = (this.currentPageQuestionnaire - 1) * this.itemsPerPage;
    return this.filteredQuestionnaires.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

 goToPageQuestionnaire(page: number): void {
    if (page < 1 || page > this.totalPagesQuestionnaire) return;
    this.currentPageQuestionnaire = page;
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
  }

  onQuestionnaireSearch(event: Event): void {
    this.questionnaireSearch = (event.target as HTMLInputElement).value;
  }

  // ── Navigation ──────────────────────────────────────────

  viewPatientResponses(patientId: string): void {
    this.router.navigate(['/physician/patient', patientId, 'responses']);
  }

  viewQuestionnaire(id: string): void {
    this.router.navigate(['/questionnaire/view', id]);
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
