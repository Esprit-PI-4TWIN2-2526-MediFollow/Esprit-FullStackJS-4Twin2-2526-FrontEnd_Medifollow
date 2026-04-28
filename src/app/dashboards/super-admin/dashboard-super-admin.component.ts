// dashboard-super-admin.component.ts (corrigÃ©)
import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import {
  Summary,
  ActivityPoint,
  ComplianceService,
  HighRiskPatient,
  Alert,
  InactivePatient,
  AIInsight,
} from '../../models/dashbored.interfaces';
import { DashboardService } from '../../services/dashbored/dashbored.service';
import { TranslateService } from '@ngx-translate/core';

type ChartModule = typeof import('chart.js');
type ChartInstance = any;

@Component({
  selector: 'app-dashboard-super-admin',
  templateUrl: './dashboard-super-admin.component.html',
  styleUrls: ['./dashboard-super-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSuperAdminComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('activityChart') activityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gaugeChart') gaugeChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chartModulePromise?: Promise<ChartModule>;
  private actChart?: ChartInstance;
  private gaugeChartInstance?: ChartInstance;

  loading = false;
  loadingInsights = false;
  showInactive = false;
  selectedRange: '7d' | '30d' | '90d' = '7d';

  ranges = [
    { label: '7j', value: '7d' as const },
    { label: '30j', value: '30d' as const },
    { label: '90j', value: '90d' as const },
  ];

  summary?: Summary;
  activity: ActivityPoint[] = [];
  compliance: ComplianceService[] = [];
  highRiskPatients: HighRiskPatient[] = [];
  alerts: Alert[] = [];
  inactivePatients: InactivePatient[] = [];
  aiInsights: AIInsight[] = [];

  get currentDate(): string {
    return new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  get rangeLabel(): string {
    const labels: Record<string, string> = {
      '7d': '7 derniers jours',
      '30d': '30 derniers jours',
      '90d': '90 derniers jours',
    };
    return labels[this.selectedRange] ?? '7 derniers jours';
  }

  get hasHighAlert(): boolean {
    return this.alerts?.some((a) => a.severity === 'HIGH' || a.type === 'critical') ?? false;
  }

  constructor(
    private dashboardService: DashboardService,
    private readonly translate: TranslateService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // Charts are drawn after data loads â€” see renderCharts()
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.actChart?.destroy();
    this.gaugeChartInstance?.destroy();
  }

  setRange(range: '7d' | '30d' | '90d'): void {
    this.selectedRange = range;
    this.loadActivity();
  }

  toggleInactive(): void {
    this.showInactive = !this.showInactive;
    if (this.showInactive && !this.inactivePatients.length) {
      this.loadInactivePatients();
    }
  }

  refreshAll(): void {
    this.loadAll();
  }

  getRateColor(rate: number): string {
    if (rate >= 70) return '#1D9E75';
    if (rate >= 40) return '#BA7517';
    return '#A32D2D';
  }

  getAvatarBg(riskScore: number): string {
    if (riskScore >= 85) return '#FCEBEB';
    return '#FAEEDA';
  }

  private loadAll(): void {
    this.loading = true;

    forkJoin({
      summary: this.dashboardService.getSummary(),
      activity: this.dashboardService.getActivity(this.selectedRange),
      compliance: this.dashboardService.getCompliance(),
      highRisk: this.dashboardService.getHighRiskPatients(),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ({ summary, activity, compliance, highRisk }) => {
          this.summary = {
            ...summary,
            staff: summary.staff || { doctors: { total: 0 }, nurses: { total: 0 }, coordinators: { total: 0 } },
            symptoms: summary.symptoms || { totalResponses: 0, pendingValidations: 0 },
            followup: summary.followup || { overallRate: 0, todayRate: 0, respondedToday: 0, everResponded: 0, completedToday: 0 },
            alerts: summary.alerts || { highRiskPatients: 0 },
            services: {
              ...summary.services,
              emergency: summary.services?.emergency || 0,
            },
          };
          this.activity = activity;
          this.compliance = compliance.map(c => ({
            ...c,
            distinctRespondents: c.distinctRespondents || Math.floor(c.patientCount * (c.complianceRate / 100))
          }));
          this.highRiskPatients = highRisk.map(p => ({
            ...p,
            totalResponses: p.totalResponses || 0,
            activeQuestionnaires: p.activeQuestionnaires || 0,
            riskScore: p.riskScore || 0,
          }));
          this.cdr.detectChanges();
          void this.renderCharts();
        },
        error: (err) => {
          console.error('Dashboard load error:', err);
        },
      });

    this.loadAIInsights();
  }

  private loadActivity(): void {
    this.dashboardService
      .getActivity(this.selectedRange)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.activity = data;
          this.cdr.detectChanges();
          void this.renderActivityChart();
        },
      });
  }

  private loadInactivePatients(): void {
    this.dashboardService
      .getInactivePatients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.inactivePatients = data.map(p => ({
            ...p,
            email: p.email || 'email@non.renseigne',
            lastLogin: p.lastLogin || p.lastSeen || new Date().toISOString(),
          }));
          this.cdr.detectChanges();
        },
      });
  }

  private loadAIInsights(): void {
    this.loadingInsights = true;
    this.dashboardService
      .getAIInsights()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingInsights = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.aiInsights = data.map(insight => ({
            ...insight,
            category: insight.type || 'general',
            severity: 'medium',
          }));
        },
        error: () => {
          this.aiInsights = [];
        },
      });
  }

  private async renderCharts(): Promise<void> {
    requestAnimationFrame(() => {
      void this.renderActivityChart();
      void this.renderGaugeChart();
    });
  }

  private async renderActivityChart(): Promise<void> {
    const canvas = this.activityChartRef?.nativeElement;
    if (!canvas) return;

    this.actChart?.destroy();
    const { Chart, registerables } = await this.getChartModule();
    Chart.register(...registerables);

    const labels = this.activity.map((p) =>
      p.date.slice(5).replace('-', '/')
    );
    const patients = this.activity.map((p) => p.newPatients);
    const responses = this.activity.map((p) => p.submittedResponses);

    this.actChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Nouveaux patients',
            data: patients,
            borderColor: '#1D9E75',
            backgroundColor: 'rgba(29,158,117,0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#1D9E75',
            borderWidth: 2,
          },
          {
            label: 'RÃ©ponses soumises',
            data: responses,
            borderColor: '#378ADD',
            backgroundColor: 'rgba(55,138,221,0.06)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#378ADD',
            borderWidth: 2,
            borderDash: [4, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { size: 10 },
              color: '#888780',
              maxTicksLimit: 12,
              autoSkip: true,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: { font: { size: 10 }, color: '#888780' },
          },
        },
      },
    });
  }

  private async renderGaugeChart(): Promise<void> {
    const canvas = this.gaugeChartRef?.nativeElement;
    if (!canvas) return;

    this.gaugeChartInstance?.destroy();
    const { Chart, registerables } = await this.getChartModule();
    Chart.register(...registerables);

    const rate = this.summary?.followup?.overallRate ?? 0;
    const color = this.getRateColor(rate);

    this.gaugeChartInstance = new Chart(canvas, {
      type: 'doughnut' as const,
      data: {
        datasets: [
          {
            data: [rate, 100 - rate],
            backgroundColor: [color, 'rgba(0,0,0,0.06)'],
            borderWidth: 0,
            circumference: 270,
            rotation: 225,
          } as any,
        ],
      },
      options: {
        responsive: false,
        cutout: '78%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        animation: {
          animateRotate: true,
          duration: 800,
        },
      },
    });
  }

  private getChartModule(): Promise<ChartModule> {
    if (!this.chartModulePromise) {
      this.chartModulePromise = import('chart.js');
    }
    return this.chartModulePromise;
  }

  userQuestion = '';
  messages: { role: 'user' | 'ai'; text: string }[] = [];

  sendQuestion() {
    if (!this.userQuestion.trim()) return;

    const question = this.userQuestion;

    this.messages.push({ role: 'user', text: question });

    this.dashboardService.askAssistant(question).subscribe({
      next: (res) => {
        this.messages.push({ role: 'ai', text: res.answer });
      },
      error: () => {
        this.messages.push({ role: 'ai', text: 'Error occurred' });
      }
    });

    this.userQuestion = '';
  }
}
