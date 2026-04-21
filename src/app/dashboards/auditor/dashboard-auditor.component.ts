import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuditAction, AuditLog, AuditLogPage, AuditReport, AuditService } from '../../services/audit.service';

@Component({
  selector: 'app-dashboard-auditor',
  templateUrl: './dashboard-auditor.component.html',
  styleUrl: './dashboard-auditor.component.css'
})
export class DashboardAuditorComponent implements OnInit, OnDestroy {
  readonly actionOptions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN'];

  report: AuditReport | null = null;
  recentLogs: AuditLog[] = [];
  isLoading = false;
  error = '';

  private readonly subscription = new Subscription();

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  refresh(): void {
    this.loadDashboard();
  }

  get totalEvents(): number {
    return this.report?.total ?? 0;
  }

  get actionChartRows(): Array<{ label: string; value: number; width: number; tone: string }> {
    const maxValue = Math.max(...this.actionOptions.map((action) => this.getMetricValue(action)), 1);

    return this.actionOptions.map((action) => {
      const value = this.getMetricValue(action);
      return {
        label: action,
        value,
        width: maxValue > 0 ? (value / maxValue) * 100 : 0,
        tone: this.getChartTone(action)
      };
    });
  }

  getMetricValue(action: AuditAction): number {
    return this.report?.countsByAction?.[String(action).toUpperCase()] ?? 0;
  }

  trackByIndex(index: number): number {
    return index;
  }

  getActionBadgeClass(action: string): string {
    switch (String(action || '').toUpperCase()) {
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

  private loadDashboard(): void {
    this.isLoading = true;
    this.error = '';

    this.subscription.add(
      this.auditService.getReport({}).subscribe({
        next: (report: AuditReport) => {
          this.report = report;
          this.isLoading = false;
        },
        error: (error) => {
          this.report = null;
          this.isLoading = false;
          this.error = error?.error?.message ?? error?.message ?? 'Failed to load audit dashboard.';
        }
      })
    );

    this.subscription.add(
      this.auditService.getLogs({ page: 1, limit: 6 }).subscribe({
        next: (page: AuditLogPage) => {
          this.recentLogs = page.items;
        },
        error: () => {
          this.recentLogs = [];
        }
      })
    );
  }

  private getChartTone(action: AuditAction): string {
    switch (String(action).toUpperCase()) {
      case 'CREATE':
        return 'from-sky-500 to-cyan-400';
      case 'UPDATE':
        return 'from-amber-500 to-yellow-400';
      case 'DELETE':
        return 'from-red-500 to-rose-400';
      case 'LOGIN':
        return 'from-emerald-500 to-teal-400';
      default:
        return 'from-slate-500 to-slate-400';
    }
  }
}
