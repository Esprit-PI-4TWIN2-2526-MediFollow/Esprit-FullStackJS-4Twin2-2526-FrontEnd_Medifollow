import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ActivityPoint, AIInsight, Alert, ComplianceService, GlobalFollowupRate, HighRiskPatient, InactivePatient, QuestionnaireStats, Summary } from '../../models/dashbored.interfaces';
import { DashboardService } from '../../services/dashbored/dashbored.service';


@Component({
  selector: 'app-dashboard-super-admin',
  templateUrl: './dashboard-super-admin.component.html',
  styleUrls: ['./dashboard-super-admin.component.scss'],
})
export class DashboardSuperAdminComponent implements OnInit {
  today = new Date();
  isLoading = true;

  summary: Summary | null = null;
  activity: ActivityPoint[] = [];
  compliance: ComplianceService[] = [];
  questStats: QuestionnaireStats | null = null;

  alerts: Alert[] = [];
  highRiskPatients: HighRiskPatient[] = [];
  followupRate: GlobalFollowupRate | null = null;
  aiInsights: AIInsight[] = [];
  inactivePatients: InactivePatient[] = [];

  showAllInactive = false;
  showAllRisk = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.isLoading = true;

    forkJoin({
      summary: this.dashboardService.getSummary(),
      activity: this.dashboardService.getActivity(),
      compliance: this.dashboardService.getCompliance(),
      questStats: this.dashboardService.getQuestionnaireStats(),
      alerts: this.dashboardService.getAlerts(),
      highRisk: this.dashboardService.getHighRiskPatients(),
      followupRate: this.dashboardService.getGlobalFollowupRate(),
      insights: this.dashboardService.getAIInsights(),
      inactive: this.dashboardService.getInactivePatients(),
    }).subscribe({
      next: data => {
        this.summary = data.summary;
        this.activity = data.activity;
        this.compliance = data.compliance;
        this.questStats = data.questStats;
        this.alerts = data.alerts ?? [];
        this.highRiskPatients = data.highRisk ?? [];
        this.followupRate = data.followupRate;
        this.aiInsights = this.normalizeInsights(data.insights ?? []);
        this.inactivePatients = data.inactive ?? [];
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }


  // ── Normalisation des AI Insights ─────────
  private normalizeInsights(raw: { type: string; message: string; recommendation: string }[]): AIInsight[] {
    return raw.map(ins => ({
      ...ins,
      category: ins.type,
      severity: this.inferSeverity(ins.type),
    }));
  }

  private inferSeverity(type: string): 'high' | 'medium' | 'low' {
    const t = type.toLowerCase();
    if (t.includes('alert') || t.includes('critical') || t.includes('urgent') || t.includes('danger')) return 'high';
    if (t.includes('warn') || t.includes('inactive') || t.includes('low')) return 'medium';
    return 'low';
  }

  get chartMax(): number {
    return Math.max(
      ...this.activity.map(d => d.newPatients + d.submittedResponses),
      1
    );
  }

  barHeight(val: number): number {
    return Math.round((val / this.chartMax) * 100);
  }

  complianceColor(rate: number): string {
    if (rate >= 75) return '#0ea472';
    if (rate >= 40) return '#d97706';
    return '#e11d48';
  }

  insightColor(severity: string): string {
    if (severity === 'high') return '#e11d48';
    if (severity === 'medium') return '#d97706';
    return '#0ea472';
  }

  trackByDate(_: number, item: ActivityPoint): string { return item.date; }
  trackById(_: number, item: { _id: string }): string { return item._id; }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  relativeDate(iso?: string): string {
    if (!iso) return '—';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff}d ago`;
  }

  alertIconColor(type: string): string {
    if (type === 'critical') return '#e11d48';
    if (type === 'warning') return '#d97706';
    return '#2563eb';
  }

  // ── Filtered getters ──────────────────────
  get criticalAlerts(): Alert[] {
    return this.alerts.filter(a => a.type === 'critical');
  }

  get visibleInactive(): InactivePatient[] {
    return this.showAllInactive ? this.inactivePatients : this.inactivePatients.slice(0, 4);
  }

  get visibleRisk(): HighRiskPatient[] {
    return this.showAllRisk ? this.highRiskPatients : this.highRiskPatients.slice(0, 4);
  }
}
