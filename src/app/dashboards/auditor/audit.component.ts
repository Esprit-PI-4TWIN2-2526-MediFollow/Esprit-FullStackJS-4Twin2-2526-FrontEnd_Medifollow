import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Instance } from 'flatpickr/dist/types/instance';
import { Subscription } from 'rxjs';
import { AuditAction, AuditLog, AuditLogPage, AuditService } from '../../services/audit.service';
import { ServiceManagementService } from '../../services/service/service-management.service';

type AuditFilters = {
  userName: string;
  service: string;
  action: AuditAction | '';
  entity: string;
  from: string;
  to: string;
};

type AuditChangeRow = {
  field: string;
  from: string;
  to: string;
};

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css'
})
export class AuditComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fromDateInput') fromDateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput?: ElementRef<HTMLInputElement>;

  readonly actionOptions: Array<AuditAction> = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'];
  readonly limitOptions = [10, 20, 50, 100] as const;

  filters: AuditFilters = {
    userName: '',
    service: '',
    action: '',
    entity: '',
    from: '',
    to: ''
  };

  page = 1;
  limit: (typeof this.limitOptions)[number] = 20;

  logs: AuditLog[] = [];
  total = 0;
  services: string[] = [];

  isLoadingLogs = false;
  logsError = '';

  private subscription = new Subscription();
  private fromPicker?: Instance;
  private toPicker?: Instance;

  constructor(
    private auditService: AuditService,
    private serviceManagementService: ServiceManagementService
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.refreshAll();
  }

  ngAfterViewInit(): void {
    this.initDatePickers();
  }

  ngOnDestroy(): void {
    this.fromPicker?.destroy();
    this.toPicker?.destroy();
    this.subscription.unsubscribe();
  }

  refreshAll(): void {
    this.loadLogs();
  }

  applyFilters(): void {
    this.page = 1;
    this.refreshAll();
  }

  clearFilters(): void {
    this.filters = { userName: '', service: '', action: '', entity: '', from: '', to: '' };
    this.fromPicker?.clear();
    this.toPicker?.clear();
    this.page = 1;
    this.refreshAll();
  }

  goToPage(nextPage: number): void {
    const normalized = Number(nextPage);
    const safePage = Math.max(1, Math.min(Number.isFinite(normalized) ? normalized : 1, this.totalPages));
    if (safePage === this.page) return;
    this.page = safePage;
    this.loadLogs();
  }

  onLimitChange(nextLimit: number): void {
    const parsed = Number(nextLimit);
    if (![10, 20, 50, 100].includes(parsed)) return;
    this.limit = parsed as any;
    this.page = 1;
    this.loadLogs();
  }

  get totalPages(): number {
    const denom = Number(this.limit) || 1;
    return Math.max(1, Math.ceil(this.total / denom));
  }

  trackByIndex(index: number): number {
    return index;
  }

  resolveTimestamp(log: AuditLog): string {
    return log.timestamp ?? '';
  }

  trackByValue(_: number, value: string): string {
    return value;
  }

  trackByField(_: number, row: AuditChangeRow): string {
    return row.field;
  }

  getActionBadgeClass(action: string): string {
    const normalized = String(action || '').toUpperCase();

    switch (normalized) {
      case 'CREATE':
        return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/20';
      case 'UPDATE':
        return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/20';
      case 'DELETE':
        return 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/20';
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/20';
      default:
        return 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/[0.06] dark:text-slate-200 dark:ring-white/[0.08]';
    }
  }

  getChangeRows(changes: unknown): AuditChangeRow[] {
    if (!this.isPlainObject(changes)) return [];
    return this.flattenDiff(changes);
  }

  hasStructuredChanges(changes: unknown): boolean {
    return this.getChangeRows(changes).length > 0;
  }

  formatChanges(changes: unknown): string {
    if (changes === null || changes === undefined) return '';
    if (typeof changes === 'string') return changes;
    try {
      return JSON.stringify(changes, null, 2);
    } catch {
      return String(changes);
    }
  }

  formatDiffValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '-';

    if (this.isArraySummary(value)) {
      return `Array (${value.length})`;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private initDatePickers(): void {
    if (this.fromDateInput) {
      this.fromPicker = flatpickr(this.fromDateInput.nativeElement, {
        static: false,
        disableMobile: true,
        monthSelectorType: 'static',
        dateFormat: 'Y-m-d',
        defaultDate: this.filters.from || undefined,
        onReady: (_, __, instance) => {
          instance.calendarContainer.classList.add('flatpickr-theme-brand');
        },
        onChange: (_, dateStr) => {
          this.filters.from = dateStr;
          if (dateStr) {
            this.toPicker?.set('minDate', dateStr);
          } else {
            this.toPicker?.set('minDate', undefined);
          }
          this.applyFilters();
        }
      });
    }

    if (this.toDateInput) {
      this.toPicker = flatpickr(this.toDateInput.nativeElement, {
        static: false,
        disableMobile: true,
        monthSelectorType: 'static',
        dateFormat: 'Y-m-d',
        defaultDate: this.filters.to || undefined,
        minDate: this.filters.from || undefined,
        onReady: (_, __, instance) => {
          instance.calendarContainer.classList.add('flatpickr-theme-brand');
        },
        onChange: (_, dateStr) => {
          this.filters.to = dateStr;
          if (dateStr) {
            this.fromPicker?.set('maxDate', dateStr);
          } else {
            this.fromPicker?.set('maxDate', undefined);
          }
          this.applyFilters();
        }
      });
    }
  }

  private flattenDiff(diff: Record<string, unknown>, parentKey = ''): AuditChangeRow[] {
    return Object.entries(diff).flatMap(([key, value]) => {
      const field = parentKey ? `${parentKey}.${key}` : key;

      if (this.isDiffLeaf(value)) {
        return [{
          field,
          from: this.formatDiffValue(value.from),
          to: this.formatDiffValue(value.to)
        }];
      }

      if (this.isPlainObject(value)) {
        return this.flattenDiff(value, field);
      }

      return [];
    });
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  private isDiffLeaf(value: unknown): value is { from: unknown; to: unknown } {
    return this.isPlainObject(value) && 'from' in value && 'to' in value;
  }

  private isArraySummary(value: unknown): value is { _type: 'array'; length: number } {
    return this.isPlainObject(value) && value['_type'] === 'array' && typeof value['length'] === 'number';
  }

  private loadLogs(): void {
    this.logsError = '';
    this.isLoadingLogs = true;

    const query = {
      page: this.page,
      limit: this.limit,
      userName: this.filters.userName || undefined,
      departement: this.filters.service || undefined,
      action: this.filters.action || undefined,
      entity: this.filters.entity || undefined,
      from: this.filters.from || undefined,
      to: this.filters.to || undefined
    };

    this.subscription.add(
      this.auditService.getLogs(query).subscribe({
        next: (page: AuditLogPage) => {
          this.logs = page.items;
          this.total = page.total;
          this.isLoadingLogs = false;
        },
        error: (error) => {
          this.logs = [];
          this.total = 0;
          this.isLoadingLogs = false;
          this.logsError = error?.error?.message ?? error?.message ?? 'Failed to load audit logs.';
        }
      })
    );
  }

  private loadServices(): void {
    this.subscription.add(
      this.serviceManagementService.getAll().subscribe({
        next: (services) => {
          this.services = services
            .filter((service) => service.statut === 'ACTIF')
            .map((service) => service.nom)
            .filter((name, index, list) => !!name && list.indexOf(name) === index)
            .sort((a, b) => a.localeCompare(b));
        },
        error: () => {
          this.services = [];
        }
      })
    );
  }
}
