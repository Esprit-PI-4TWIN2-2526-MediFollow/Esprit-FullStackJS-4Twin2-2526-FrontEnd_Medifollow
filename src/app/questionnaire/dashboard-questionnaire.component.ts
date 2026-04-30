import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Questionnaire } from '../models/questionnaire';
import { QuestionnaireService } from '../services/questionnaire.service';

@Component({
  selector: 'app-dashboard-questionnaire',
  templateUrl: './dashboard-questionnaire.component.html',
  styleUrls: ['./dashboard-questionnaire.component.css']
})
export class DashboardQuestionnaireComponent implements OnInit {

  questionnaires: Questionnaire[] = [];
  isLoading = true;
  errorMessage = '';

  // Delete modal
  questionnaireToDelete: Questionnaire | null = null;
  isDeleting = false;
// Variables pour le modal d'archive
questionnaireToArchive: Questionnaire | null = null;
questionnaireToRestore: Questionnaire | null = null;
 // ── Pagination ──────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 6;
  constructor(
    private questionnaireService: QuestionnaireService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadQuestionnaires();
  }

  loadQuestionnaires(): void {
    this.isLoading = true;
    this.questionnaireService.getAll().subscribe({
      next: (data) => {
        this.questionnaires = data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = this.translate.instant('QUESTIONNAIRE_DASHBOARD.ERROR_LOAD');
        this.isLoading = false;
      }
    });
  }

// ── Search + Filter ─────────────────────────────────────
searchTerm = '';
statusFilter: 'all' | 'active' | 'inactive' | 'archived' = 'all';

get filteredQuestionnaires(): Questionnaire[] {
  return this.questionnaires.filter(q => {
    const matchSearch = q.title.toLowerCase()
      .includes(this.searchTerm.toLowerCase())
      || q.medicalService.toLowerCase()
      .includes(this.searchTerm.toLowerCase());
    const matchStatus =
      this.statusFilter === 'all'
      || q.status === this.statusFilter;
    return matchSearch && matchStatus;
  });
}

onSearchInput(event: Event): void {
  this.searchTerm = (event.target as HTMLInputElement).value;
  this.currentPage = 1;
}

// ── Pagination ──────────────────────────────────────────

  get paginatedQuestionnaires(): Questionnaire[] {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredQuestionnaires.slice(start, start + this.itemsPerPage);
}

get totalPages(): number {
  return Math.ceil(this.filteredQuestionnaires.length / this.itemsPerPage);
}

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }
 // ── Navigation ──────────────────────────────────────────
  goToCreate(): void {
    this.router.navigate(['/questionnaire/create']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/questionnaire/edit', id]);
  }

  goToView(id: string): void {
    this.router.navigate(['/questionnaire/view', id]);
  }

  toggleStatus(questionnaire: Questionnaire): void {
    this.questionnaireService.toggleStatus(questionnaire._id!).subscribe({
      next: (updated) => {
        const index = this.questionnaires.findIndex(q => q._id === updated._id);
        if (index !== -1) this.questionnaires[index] = updated;
      },
      error: () => {
        this.errorMessage = this.translate.instant('QUESTIONNAIRE_DASHBOARD.ERROR_STATUS');
      }
    });
  }

  handleDelete(questionnaire: Questionnaire): void {
  this.questionnaireToDelete = questionnaire;
}

confirmDelete(): void {
  if (!this.questionnaireToDelete) return;

  this.isDeleting = true;
  this.questionnaireService.delete(this.questionnaireToDelete._id!).subscribe({
    next: () => {
      this.questionnaires = this.questionnaires.filter(
        q => q._id !== this.questionnaireToDelete!._id
      );
      this.questionnaireToDelete = null;
      this.isDeleting = false;
    },
    error: () => {
      this.errorMessage = this.translate.instant('QUESTIONNAIRE_DASHBOARD.ERROR_DELETE');
      setTimeout(() => this.errorMessage = '', 4000);
      this.questionnaireToDelete = null;
      this.isDeleting = false;
    }
  });
}

cancelDelete(): void {
  this.questionnaireToDelete = null;
}




// Méthodes pour Archive avec modal
archiveQuestionnaire(questionnaire: Questionnaire): void {
  this.questionnaireToArchive = questionnaire;
}

confirmArchive(): void {
  if (!this.questionnaireToArchive) return;

  this.questionnaireService.archive(this.questionnaireToArchive._id!).subscribe({
    next: (updated) => {
      const index = this.questionnaires.findIndex(q => q._id === updated._id);
      if (index !== -1) this.questionnaires[index] = updated;
      this.questionnaireToArchive = null;
    },
    error: () => {
      this.errorMessage = this.translate.instant('QUESTIONNAIRE_DASHBOARD.ERROR_ARCHIVE');
      setTimeout(() => this.errorMessage = '', 4000);
      this.questionnaireToArchive = null;
    }
  });
}

cancelArchive(): void {
  this.questionnaireToArchive = null;
}

// Restore Modal
restoreQuestionnaire(q: Questionnaire): void {
  this.questionnaireToRestore = q;
}

confirmRestore(): void {
  if (!this.questionnaireToRestore) return;
  this.questionnaireService.restore(this.questionnaireToRestore._id!).subscribe({
    next: (updated) => {
      const index = this.questionnaires.findIndex(q => q._id === updated._id);
      if (index !== -1) this.questionnaires[index] = updated;
      this.questionnaireToRestore = null;
    },
    error: () => {
      this.errorMessage = this.translate.instant('QUESTIONNAIRE_DASHBOARD.ERROR_RESTORE');
      setTimeout(() => this.errorMessage = '', 4000);
      this.questionnaireToRestore = null;
    }
  });
}

cancelRestore(): void {
  this.questionnaireToRestore = null;
}

getQuestionCountLabel(count: number): string {
  return this.translate.instant('QUESTIONNAIRE_DASHBOARD.QUESTION_COUNT', { count });
}

getStatusLabel(status: 'active' | 'inactive' | 'archived'): string {
  const keyMap = {
    active: 'QUESTIONNAIRE_DASHBOARD.STATUS_ACTIVE',
    inactive: 'QUESTIONNAIRE_DASHBOARD.STATUS_INACTIVE',
    archived: 'QUESTIONNAIRE_DASHBOARD.STATUS_ARCHIVED',
  };

  return this.translate.instant(keyMap[status]);
}
}
