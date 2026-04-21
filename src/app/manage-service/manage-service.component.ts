import {
  Component, OnInit, OnDestroy,
  signal, computed, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Service, ServiceManagementService } from '../services/service/service-management.service';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-manage-service',
  templateUrl: './manage-service.component.html',
  styleUrl: './manage-service.component.scss'
})
export class ManageServiceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private svc = inject(ServiceManagementService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);


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

  currentStep = signal<1 | 2 | 3>(1);

  showAiModal = signal(false);
  aiDescription = signal('');
  aiLoading = signal(false);
  aiError = signal<string | null>(null);

  filteredServices = computed(() => {
    let list = this.services();
    const q = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    if (q) list = list.filter(s =>
      s.nom.toLowerCase().includes(q) ||
      s.type?.toLowerCase().includes(q) ||
      s.localisation?.toLowerCase().includes(q)
    );
    if (status !== 'ALL') {
      const mapped = status === 'ACTIVE' ? 'ACTIF' : 'INACTIF';
      list = list.filter(s => s.statut === mapped);
    }
    return list;
  });

  stats = computed(() => {
    const all = this.services();
    return {
      total: all.length,
      active: all.filter(s => s.statut === 'ACTIF').length,
      inactive: all.filter(s => s.statut === 'INACTIF').length,
      emergency: all.filter(s => s.estUrgence).length,
    };
  });

  form!: FormGroup;

  readonly SERVICE_TYPES = ['Medical', 'Emergency', 'Consultation', 'Surgery', 'Laboratory', 'Radiology', 'Pharmacy', 'Administrative'];
  readonly DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    this.horairesArray.push(this.fb.group({
      jour: ['Monday'], ouverture: ['08:00'], fermeture: ['17:00'],
    }));
  }

  removeHoraire(i: number): void {
    this.horairesArray.removeAt(i);
  }

  t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }

  serviceTypeLabel(type?: string | null): string {
    if (!type) return this.t('MANAGE_SERVICES.COMMON.NOT_AVAILABLE');

    const map: Record<string, string> = {
      Medical: 'MANAGE_SERVICES.TYPES.MEDICAL',
      Emergency: 'MANAGE_SERVICES.TYPES.EMERGENCY',
      Consultation: 'MANAGE_SERVICES.TYPES.CONSULTATION',
      Surgery: 'MANAGE_SERVICES.TYPES.SURGERY',
      Laboratory: 'MANAGE_SERVICES.TYPES.LABORATORY',
      Radiology: 'MANAGE_SERVICES.TYPES.RADIOLOGY',
      Pharmacy: 'MANAGE_SERVICES.TYPES.PHARMACY',
      Administrative: 'MANAGE_SERVICES.TYPES.ADMINISTRATIVE',
    };

    return this.t(map[type] || 'MANAGE_SERVICES.COMMON.NOT_AVAILABLE');
  }

  dayLabel(day: string): string {
    const map: Record<string, string> = {
      Monday: 'MANAGE_SERVICES.DAYS.MONDAY',
      Tuesday: 'MANAGE_SERVICES.DAYS.TUESDAY',
      Wednesday: 'MANAGE_SERVICES.DAYS.WEDNESDAY',
      Thursday: 'MANAGE_SERVICES.DAYS.THURSDAY',
      Friday: 'MANAGE_SERVICES.DAYS.FRIDAY',
      Saturday: 'MANAGE_SERVICES.DAYS.SATURDAY',
      Sunday: 'MANAGE_SERVICES.DAYS.SUNDAY',
    };

    return this.t(map[day] || day);
  }

  statusLabel(status: string): string {
    return this.t(status === 'ACTIF' ? 'MANAGE_SERVICES.STATUS.ACTIVE' : 'MANAGE_SERVICES.STATUS.INACTIVE');
  }

  // ── Schedule presets ───────────────────────────────
  applyPreset(type: string): void {
    this.horairesArray.clear();

    const days = (dayList: string[], open: string, close: string) =>
      dayList.forEach(jour => this.horairesArray.push(
        this.fb.group({ jour: [jour], ouverture: [open], fermeture: [close] })
      ));

    switch (type) {
      case 'weekdays':
        days(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '08:00', '17:00');
        break;
      case 'extended':
        days(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], '07:30', '16:00');
        break;
      case '24h':
        days(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], '00:00', '23:59');
        break;
      case 'pharmacy':
        days(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], '08:00', '20:00');
        break;
    }
  }

  goToStep(step: 1 | 2 | 3): void {
    this.currentStep.set(step);
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step === 1) {
      const nomCtrl = this.form.get('nom');
      nomCtrl?.markAsTouched();
      if (nomCtrl?.invalid) return;
    }
    if (step === 2) {
      const emailCtrl = this.form.get('email');
      emailCtrl?.markAsTouched();
      if (emailCtrl?.invalid) return;
    }
    if (step < 3) this.currentStep.set((step + 1) as 1 | 2 | 3);
  }

  prevStep(): void {
    const step = this.currentStep();
    if (step > 1) this.currentStep.set((step - 1) as 1 | 2 | 3);
  }


  loadServices(): void {
    this.loading.set(true);
    this.error.set(null);
    this.svc.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: data => { this.services.set(data); this.loading.set(false); },
      error: () => { this.error.set(this.t('MANAGE_SERVICES.ERRORS.LOAD')); this.loading.set(false); },
    });
  }

  openCreateModal(): void {
    this.form.reset({ statut: 'ACTIF', estUrgence: false, capacite: 0, tempsAttenteMoyen: 0 });
    this.horairesArray.clear();
    this.currentStep.set(1);
    this.modalMode.set('create');
    this.selectedService.set(null);
    this.showModal.set(true);
  }

  openEditModal(service: Service): void {
    this.selectedService.set(service);
    this.modalMode.set('edit');
    this.currentStep.set(1);
    this.horairesArray.clear();
    service.horaires?.forEach(h =>
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
    this.currentStep.set(1);
  }

  submitForm(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.value;
    const mode = this.modalMode();

    if (mode === 'create') {
      this.svc.create(value).pipe(takeUntil(this.destroy$)).subscribe({
        next: created => {
          this.services.update(list => [created, ...list]);
          this.closeModal();
          this.showToast(this.t('MANAGE_SERVICES.TOAST.CREATED'), 'success');
        },
        error: () => this.showToast(this.t('MANAGE_SERVICES.ERRORS.CREATE'), 'error'),
      });
    } else if (mode === 'edit' && this.selectedService()?._id) {
      this.svc.update(this.selectedService()!._id!, value).pipe(takeUntil(this.destroy$)).subscribe({
        next: updated => {
          this.services.update(list => list.map(s => s._id === updated._id ? updated : s));
          this.closeModal();
          this.showToast(this.t('MANAGE_SERVICES.TOAST.UPDATED'), 'success');
        },
        error: () => this.showToast(this.t('MANAGE_SERVICES.ERRORS.UPDATE'), 'error'),
      });
    }
  }

  toggleStatus(service: Service): void {
    const action = service.statut === 'ACTIF' ? this.svc.deactivate(service._id!) : this.svc.activate(service._id!);
    action.pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => {
        this.services.update(list => list.map(s => s._id === updated._id ? updated : s));
        this.showToast(this.t(updated.statut === 'ACTIF' ? 'MANAGE_SERVICES.TOAST.ACTIVATED' : 'MANAGE_SERVICES.TOAST.DEACTIVATED'), 'success');
      },
      error: () => this.showToast(this.t('MANAGE_SERVICES.ERRORS.STATUS'), 'error'),
    });
  }

  confirmDelete(id: string): void { this.serviceToDelete.set(id); this.showDeleteConfirm.set(true); }

  deleteService(): void {
    const id = this.serviceToDelete();
    if (!id) return;
    this.svc.delete(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.services.update(list => list.filter(s => s._id !== id));
        this.showDeleteConfirm.set(false);
        this.serviceToDelete.set(null);
        this.showToast(this.t('MANAGE_SERVICES.TOAST.DELETED'), 'success');
      },
      error: () => this.showToast(this.t('MANAGE_SERVICES.ERRORS.DELETE'), 'error'),
    });
  }

  // AI
  openAiModal(): void { this.aiDescription.set(''); this.aiError.set(null); this.showAiModal.set(true); }
  closeAiModal(): void { this.showAiModal.set(false); this.aiError.set(null); }

  generateWithAI(): void {
    const desc = this.aiDescription().trim();
    if (!desc) return;
    this.aiLoading.set(true);
    this.aiError.set(null);

    this.svc.generateWithAI(desc).pipe(takeUntil(this.destroy$)).subscribe({
      next: (generated: Partial<Service>) => {
        this.aiLoading.set(false);
        this.closeAiModal();

        this.form.reset({ statut: 'ACTIF', estUrgence: false, capacite: 0, tempsAttenteMoyen: 0 });
        this.horairesArray.clear();

        generated.horaires?.forEach(h =>
          this.horairesArray.push(this.fb.group({ jour: [h.jour], ouverture: [h.ouverture], fermeture: [h.fermeture] }))
        );

        this.form.patchValue({
          nom: generated.nom ?? '',
          description: generated.description ?? '',
          localisation: generated.localisation ?? '',
          type: generated.type ?? '',
          telephone: generated.telephone ?? '',
          email: generated.email ?? '',
          capacite: generated.capacite ?? 0,
          tempsAttenteMoyen: generated.tempsAttenteMoyen ?? 0,
          statut: generated.statut ?? 'ACTIF',
          estUrgence: generated.estUrgence ?? false,
          responsableId: generated.responsableId ?? '',
        });

        this.currentStep.set(1);
        this.modalMode.set('create');
        this.selectedService.set(null);
        this.showModal.set(true);
        this.showToast(this.t('MANAGE_SERVICES.TOAST.AI_PREFILL'), 'success');
      },
      error: () => {
        this.aiLoading.set(false);
        this.aiError.set(this.t('MANAGE_SERVICES.ERRORS.AI'));
      },
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
