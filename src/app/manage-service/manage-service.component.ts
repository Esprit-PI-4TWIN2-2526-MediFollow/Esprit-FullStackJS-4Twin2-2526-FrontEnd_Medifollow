import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Service, ServiceManagementService } from '../services/service/service-management.service';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'ALL' | 'ACTIF' | 'INACTIF';

@Component({
  selector: 'app-manage-service',
  templateUrl: './manage-service.component.html',
  styleUrl: './manage-service.component.scss'
})
export class ManageServiceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private svc = inject(ServiceManagementService);
  private fb = inject(FormBuilder);

  // State signals
  services = signal<Service[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal<FilterStatus>('ALL');
  viewMode = signal<ViewMode>('grid');
  selectedService = signal<Service | null>(null);
  showModal = signal(false);
  modalMode = signal<'create' | 'edit' | 'view'>('create');
  showDeleteConfirm = signal(false);
  serviceToDelete = signal<string | null>(null);
  toastMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  // Computed
  filteredServices = computed(() => {
    let list = this.services();
    const q = this.searchQuery().toLowerCase();
    const status = this.filterStatus();

    if (q) {
      list = list.filter(
        (s) =>
          s.nom.toLowerCase().includes(q) ||
          s.type?.toLowerCase().includes(q) ||
          s.localisation?.toLowerCase().includes(q)
      );
    }
    if (status !== 'ALL') {
      list = list.filter((s) => s.statut === status);
    }
    return list;
  });

  stats = computed(() => {
    const all = this.services();
    return {
      total: all.length,
      actif: all.filter((s) => s.statut === 'ACTIF').length,
      inactif: all.filter((s) => s.statut === 'INACTIF').length,
      urgence: all.filter((s) => s.estUrgence).length,
    };
  });

  // Form
  form!: FormGroup;

  readonly SERVICE_TYPES = ['Médical', 'Urgence', 'Consultation', 'Chirurgie', 'Laboratoire', 'Radiologie', 'Pharmacie', 'Administratif'];
  readonly JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  ngOnInit(): void {
    this.initForm();
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      localisation: [''],
      type: [''],
      telephone: [''],
      email: ['', Validators.email],
      capacite: [0, Validators.min(0)],
      statut: ['ACTIF'],
      tempsAttenteMoyen: [0, Validators.min(0)],
      estUrgence: [false],
      responsableId: [''],
      horaires: this.fb.array([]),
    });
  }

  get horairesArray(): FormArray {
    return this.form.get('horaires') as FormArray;
  }

  addHoraire(): void {
    this.horairesArray.push(
      this.fb.group({
        jour: ['Lundi'],
        ouverture: ['08:00'],
        fermeture: ['18:00'],
      })
    );
  }

  removeHoraire(i: number): void {
    this.horairesArray.removeAt(i);
  }

  loadServices(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc
      .getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.services.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Erreur lors du chargement des services');
          this.loading.set(false);
        },
      });
  }

  openCreateModal(): void {
    this.form.reset({ statut: 'ACTIF', estUrgence: false, capacite: 0, tempsAttenteMoyen: 0 });
    this.horairesArray.clear();
    this.modalMode.set('create');
    this.selectedService.set(null);
    this.showModal.set(true);
  }

  openEditModal(service: Service): void {
    this.selectedService.set(service);
    this.modalMode.set('edit');
    this.horairesArray.clear();
    service.horaires?.forEach((h) =>
      this.horairesArray.push(this.fb.group({ jour: [h.jour], ouverture: [h.ouverture], fermeture: [h.fermeture] }))
    );
    this.form.patchValue(service);
    this.showModal.set(true);
  }

  openViewModal(service: Service): void {
    this.selectedService.set(service);
    this.modalMode.set('view');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedService.set(null);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.value;
    const mode = this.modalMode();

    if (mode === 'create') {
      this.svc
        .create(value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (created) => {
            this.services.update((list) => [created, ...list]);
            this.closeModal();
            this.showToast('Service créé avec succès', 'success');
          },
          error: () => this.showToast('Erreur lors de la création', 'error'),
        });
    } else if (mode === 'edit' && this.selectedService()?._id) {
      this.svc
        .update(this.selectedService()!._id!, value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updated) => {
            this.services.update((list) =>
              list.map((s) => (s._id === updated._id ? updated : s))
            );
            this.closeModal();
            this.showToast('Service mis à jour', 'success');
          },
          error: () => this.showToast('Erreur lors de la mise à jour', 'error'),
        });
    }
  }

  toggleStatus(service: Service): void {
    const action = service.statut === 'ACTIF' ? this.svc.deactivate(service._id!) : this.svc.activate(service._id!);
    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.services.update((list) =>
          list.map((s) => (s._id === updated._id ? updated : s))
        );
        this.showToast(`Service ${updated.statut === 'ACTIF' ? 'activé' : 'désactivé'}`, 'success');
      },
      error: () => this.showToast('Erreur lors du changement de statut', 'error'),
    });
  }

  confirmDelete(id: string): void {
    this.serviceToDelete.set(id);
    this.showDeleteConfirm.set(true);
  }

  deleteService(): void {
    const id = this.serviceToDelete();
    if (!id) return;
    this.svc
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.services.update((list) => list.filter((s) => s._id !== id));
          this.showDeleteConfirm.set(false);
          this.serviceToDelete.set(null);
          this.showToast('Service supprimé', 'success');
        },
        error: () => this.showToast('Erreur lors de la suppression', 'error'),
      });
  }

  showToast(text: string, type: 'success' | 'error'): void {
    this.toastMessage.set({ text, type });
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  setView(mode: ViewMode): void { this.viewMode.set(mode); }
  setFilter(status: FilterStatus): void { this.filterStatus.set(status); }
  onSearch(val: string): void { this.searchQuery.set(val); }
  trackById(_: number, s: Service) { return s._id; }
}
