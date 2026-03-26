import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import {
  CoordinatorDashboardMetrics,
  CoordinatorDashboardService,
  CoordinatorRange
} from '../../services/coordinator-dashboard.service';

@Component({
  selector: 'app-dashboard-coordinator',
  templateUrl: './dashboard-coordinator.component.html',
  styleUrl: './dashboard-coordinator.component.css'
})
export class DashboardCoordinatorComponent implements OnInit {
  readonly ranges: CoordinatorRange[] = ['7d', '30d', '90d'];

  selectedRange: CoordinatorRange = '7d';
  metrics: CoordinatorDashboardMetrics = {
    completedQuestionnaires: 0,
    submittedSymptoms: 0,
    submittedVitalSigns: 0,
    validatedSymptoms: 0,
    pendingValidations: 0,
    questionnaireActivity: [],
    symptomActivity: [],
    generalActivity: []
  };

  isLoading = true;
  errorMessage = '';

  questionnaireChartData: ChartConfiguration<'line'>['data'] = this.createEmptyChartData('Questionnaires', '#0f766e');
  symptomChartData: ChartConfiguration<'line'>['data'] = this.createEmptyChartData('Symptoms', '#0284c7');
  generalChartData: ChartConfiguration<'line'>['data'] = this.createEmptyChartData('Activity', '#7c3aed');

  readonly lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  constructor(private coordinatorDashboardService: CoordinatorDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  setRange(range: CoordinatorRange): void {
    if (this.selectedRange === range || this.isLoading) {
      return;
    }

    this.selectedRange = range;
    this.loadDashboard();
  }

  get hasDashboardData(): boolean {
    const pointsTotal =
      this.metrics.questionnaireActivity.length
      + this.metrics.symptomActivity.length
      + this.metrics.generalActivity.length;

    const countsTotal =
      this.metrics.completedQuestionnaires
      + this.metrics.submittedSymptoms
      + this.metrics.submittedVitalSigns
      + this.metrics.validatedSymptoms
      + this.metrics.pendingValidations;

    return pointsTotal > 0 || countsTotal > 0;
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.coordinatorDashboardService.getDashboard(this.selectedRange).subscribe({
      next: (metrics) => {
        this.metrics = metrics ?? this.metrics;
        this.questionnaireChartData = this.createChartData('Questionnaires', '#0f766e', metrics.questionnaireActivity);
        this.symptomChartData = this.createChartData('Symptoms', '#0284c7', metrics.symptomActivity);
        this.generalChartData = this.createChartData('Activity', '#7c3aed', metrics.generalActivity);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load coordinator dashboard data.';
        this.isLoading = false;
      }
    });
  }

  private createEmptyChartData(label: string, color: string): ChartConfiguration<'line'>['data'] {
    return this.createChartData(label, color, []);
  }

  private createChartData(
    label: string,
    color: string,
    points: Array<{ label: string; value: number }>
  ): ChartConfiguration<'line'>['data'] {
    return {
      labels: points.map((point) => point.label),
      datasets: [
        {
          label,
          data: points.map((point) => point.value),
          borderColor: color,
          backgroundColor: `${color}22`,
          tension: 0.35,
          fill: true,
          pointBackgroundColor: color,
          pointBorderColor: color,
          pointRadius: 3
        }
      ]
    };
  }

}
