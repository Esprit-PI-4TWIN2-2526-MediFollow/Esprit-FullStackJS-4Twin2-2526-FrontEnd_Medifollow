import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { SymptomForm, SymptomService } from '../services/symptom.service';

@Component({
  selector: 'app-dashboard-symptoms',
  templateUrl: './dashboard-symptoms.component.html',
  styleUrl: './dashboard-symptoms.component.css'
})
export class DashboardSymptomsComponent implements OnInit {
  forms: SymptomForm[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  currentPage = 1;
  itemsPerPage = 6;

  constructor(
    private symptomService: SymptomService,
    private router: Router,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.symptomService.getForms().subscribe({
      next: (forms) => {
        this.forms = forms;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load symptoms forms', error);
        this.errorMessage = this.translate.instant('SYMPTOMS_DASHBOARD.ERROR_LOAD');
        this.isLoading = false;
      }
    });
  }

  goToCreate(): void {
    this.router.navigate(['/symptoms/builder']);
  }

  goToEdit(id: string): void {
    this.router.navigate(['/symptoms/builder', id]);
  }

  goToView(id: string): void {
    this.router.navigate(['/symptoms/view', id]);
  }

  deleteForm(id: string, title: string): void {
    void Swal.fire({
      title: this.translate.instant('SYMPTOMS_DASHBOARD.DELETE_TITLE'),
      text: this.translate.instant('SYMPTOMS_DASHBOARD.DELETE_CONFIRM', { title }),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: this.translate.instant('SYMPTOMS_DASHBOARD.DELETE'),
      cancelButtonText: this.translate.instant('SYMPTOMS_DASHBOARD.CANCEL'),
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.symptomService.deleteForm(id).subscribe({
        next: () => {
          this.forms = this.forms.filter((form) => form._id !== id);
          if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
          }

          void Swal.fire({
            icon: 'success',
            title: this.translate.instant('SYMPTOMS_DASHBOARD.DELETE_SUCCESS_TITLE'),
            text: this.translate.instant('SYMPTOMS_DASHBOARD.DELETE_SUCCESS_TEXT'),
            confirmButtonColor: '#465fff',
          });
        },
        error: (error) => {
          console.error('Failed to delete symptoms form', error);
          this.errorMessage = this.translate.instant('SYMPTOMS_DASHBOARD.ERROR_DELETE');
        }
      });
    });
  }

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
  }

  get filteredForms(): SymptomForm[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.forms.filter((form) => {
      const formStatus = form.status || 'active';
      const matchesSearch = !term || form.title.toLowerCase().includes(term);
      const matchesStatus =
        this.statusFilter === 'all' || formStatus === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get paginatedForms(): SymptomForm[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredForms.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredForms.length / this.itemsPerPage));
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  getFormStatus(form: SymptomForm): 'active' | 'inactive' {
    return form.status || 'active';
  }

  getQuestionCountLabel(count: number): string {
    return this.translate.instant('SYMPTOMS_DASHBOARD.QUESTION_COUNT', { count });
  }

  getStatusLabel(status: 'active' | 'inactive'): string {
    return this.translate.instant(
      status === 'active'
        ? 'SYMPTOMS_DASHBOARD.STATUS_ACTIVE'
        : 'SYMPTOMS_DASHBOARD.STATUS_INACTIVE'
    );
  }
}
