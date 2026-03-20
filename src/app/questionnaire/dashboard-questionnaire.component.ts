import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

 // ── Pagination ──────────────────────────────────────────
  currentPage = 1;
  itemsPerPage = 6;
  constructor(
    private questionnaireService: QuestionnaireService,
    private router: Router
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
        this.errorMessage = 'Failed to load questionnaires.';
        this.isLoading = false;
      }
    });
  }

// ── Pagination ──────────────────────────────────────────

  get totalPages(): number {
    return Math.ceil(this.questionnaires.length / this.itemsPerPage);
  }

  get paginatedQuestionnaires(): Questionnaire[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.questionnaires.slice(start, start + this.itemsPerPage);
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
        this.errorMessage = 'Failed to update status.';
      }
    });
  }

  handleDelete(questionnaire: Questionnaire): void {
    this.questionnaireToDelete = questionnaire;
  }

  cancelDelete(): void {
    this.questionnaireToDelete = null;
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
        this.errorMessage = 'Failed to delete questionnaire.';
        this.isDeleting = false;
      }
    });
  }
}
