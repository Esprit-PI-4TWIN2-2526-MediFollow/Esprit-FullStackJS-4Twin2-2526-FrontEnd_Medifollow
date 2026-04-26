import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ChartData, ChartDataset, ChartOptions, TooltipItem } from 'chart.js';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import {
  DoctorSymptomsService,
  DoctorSymptomsSubmission,
} from '../../services/doctor-symptoms.service';
import { AiAnalysis } from '../../models/ai-analysis';
import { AiAnalysisService } from '../../services/ai-analysis.service';

type StatsType = 'temperature' | 'heartRate' | 'bloodPressure' | 'spo2';
type StatsPeriod = 'today' | 'week' | 'all';

@Component({
  selector: 'app-doctor-view-symptoms',
  templateUrl: './doctor-view-symptoms.component.html',
  styleUrl: './doctor-view-symptoms.component.css'
})
export class DoctorViewSymptomsComponent implements OnInit {
  private readonly normalColor = '#2563eb';
  private readonly abnormalColor = '#ef4444';

  patientId = '';
  patient: Users | null = null;
  submissions: DoctorSymptomsSubmission[] = [];
  selectedSubmission: DoctorSymptomsSubmission | null = null;
  temperatureData: Array<{ date: string; value: number }> = [];
  heartRateData: Array<{ date: string; value: number }> = [];
  bpData: Array<{ date: string; systolic: number; diastolic: number }> = [];
  spo2Data: Array<{ date: string; value: number }> = [];

  isLoadingPatient = true;
  isLoadingSymptoms = true;
  isLoadingVitalsHistory = true;

  errorMessage = '';
  vitalsHistoryError = '';

  aiAnalysis: AiAnalysis | null = null;
  isLoadingAnalysis = false;
  analysisError = '';
  showStatsModal = false;
  selectedStatsType: StatsType = 'spo2';
  selectedStatsPeriod: StatsPeriod = 'today';
  selectedStatsChartData: ChartData<'line'> = this.createEmptyLineChartData('SpO2 (%)');
  selectedStatsChartOptions: ChartOptions<'line'> = this.createLineChartOptions('SpO2 (%)');
  selectedStatsLastValue = '-';
  selectedStatsAverage = '-';
  selectedStatsRange = '-';
  selectedStatsMeasures = 0;
  selectedStatsInterpretation = 'No data available for interpretation.';
  selectedStatsInterpretationWarning = false;

  temperatureChartData: ChartData<'line'> = this.createEmptyLineChartData('Temperature (degC)');
  heartRateChartData: ChartData<'line'> = this.createEmptyLineChartData('Heart Rate (bpm)');
  bloodPressureChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      this.createEmptyLineDataset('Systolic (mmHg)', this.normalColor),
      this.createEmptyLineDataset('Diastolic (mmHg)', '#0ea5e9'),
    ]
  };
  spo2ChartData: ChartData<'line'> = this.createEmptyLineChartData('SpO2 (%)');

  readonly temperatureChartOptions = this.createLineChartOptions('Temperature (degC)');
  readonly heartRateChartOptions = this.createLineChartOptions('Heart Rate (bpm)');
  readonly bloodPressureChartOptions = this.createLineChartOptions('Blood Pressure (mmHg)', true);
  spo2ChartOptions: ChartOptions<'line'> = {
    ...this.createLineChartOptions('SpO2 (%)'),
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
          maxRotation: 0,
          autoSkip: true,
        },
      },
      y: {
        min: 90,
        max: 100,
        grid: {
          color: 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: '#6b7280',
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'SpO2 (%)',
          color: '#64748b',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usersService: UsersService,
    private doctorSymptomsService: DoctorSymptomsService,
    private aiAnalysisService: AiAnalysisService
  ) {}

  ngOnInit(): void {
    this.patientId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPatient();
    this.loadSymptoms();
  }

  get hasVitalsHistory(): boolean {
    return this.submissions.length >= 2;
  }

  loadAiAnalysis(submission: DoctorSymptomsSubmission): void {
    if (!submission || !submission.answers || submission.answers.length === 0) {
      this.analysisError = 'No answers are available to generate AI analysis.';
      this.aiAnalysis = null;
      return;
    }

    this.isLoadingAnalysis = true;
    this.analysisError = '';

    this.aiAnalysisService.generateAnalysis(this.patientId, submission.answers)
      .subscribe({
        next: (analysis) => {
          this.aiAnalysis = analysis;
          this.isLoadingAnalysis = false;
        },
        error: (error) => {
          console.error('Failed to generate AI analysis', error);
          this.analysisError = 'Unable to generate AI analysis right now. Please retry.';
          this.isLoadingAnalysis = false;
        }
      });
  }

  getGravityClasses(gravity: string | undefined): string {
    if (!gravity) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';

    switch (gravity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300';
      default:
        return 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300';
    }
  }

  getFindingBorderClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30';
      case 'high': return 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/30';
      default: return 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30';
    }
  }

  getFindingValueClass(severity: string): string {
    switch (severity) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-amber-600 dark:text-amber-400';
    }
  }

  getFindingIconClass(severity: string): string {
    if (severity === 'critical') return 'text-red-500';
    if (severity === 'high') return 'text-orange-500';
    return 'text-amber-500';
  }

  getRecommendations(): { title: string; detail: string }[] {
    if (!this.aiAnalysis?.gravity) return [];
    const gravity = this.aiAnalysis.gravity;

    if (gravity === 'critical') return [
      { title: 'Urgent medical evaluation', detail: 'Immediate physician assessment required' },
      { title: 'Continuous vital monitoring', detail: 'Do not leave patient unattended' },
      { title: 'Consider hospitalization', detail: 'Evaluate need for immediate admission' },
    ];
    if (gravity === 'high') return [
      { title: 'Close monitoring required', detail: 'Re-evaluate vitals within 1-2 hours' },
      { title: 'Full re-evaluation recommended', detail: 'Review treatment plan and adjust accordingly' },
    ];
    if (gravity === 'medium') return [
      { title: 'Enhanced monitoring', detail: 'Re-check vitals within 4 hours' },
      { title: 'Maintain daily follow-up', detail: 'Continue standard protocol with attention' },
    ];
    return [
      { title: 'Standard follow-up', detail: 'Next check-up according to service protocol' },
    ];
  }

  selectSubmission(submission: DoctorSymptomsSubmission): void {
    this.selectedSubmission = submission;
    this.buildCharts();
    this.rebuildSelectedStatsChart();
    this.aiAnalysis = null;
    this.analysisError = '';
    this.loadAiAnalysis(submission);
  }

  isSelected(submission: DoctorSymptomsSubmission): boolean {
    return this.selectedSubmission?._id === submission._id;
  }

  openStatsModal(): void {
    this.showStatsModal = true;
    this.rebuildSelectedStatsChart();
  }

  closeStatsModal(): void {
    this.showStatsModal = false;
  }

  setStatsType(type: StatsType): void {
    this.selectedStatsType = type;
    this.rebuildSelectedStatsChart();
  }

  setStatsPeriod(period: StatsPeriod): void {
    this.selectedStatsPeriod = period;
    this.rebuildSelectedStatsChart();
  }

  getStatsTypeLabel(type = this.selectedStatsType): string {
    switch (type) {
      case 'temperature': return 'Temperature';
      case 'heartRate': return 'Heart Rate';
      case 'bloodPressure': return 'Blood Pressure';
      default: return 'SpO2';
    }
  }

  getStatsPeriodLabel(): string {
    switch (this.selectedStatsPeriod) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 days';
      default: return 'All period';
    }
  }

  getUserInitials(): string {
    const first = this.patient?.firstName?.charAt(0) || '';
    const last = this.patient?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '?';
  }

  goBack(): void {
    this.router.navigate(['/doctor/dashboard']);
  }

  private loadPatient(): void {
    this.usersService.getUserById(this.patientId).subscribe({
      next: (patient) => {
        this.patient = patient;
        this.isLoadingPatient = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load patient information.';
        this.isLoadingPatient = false;
      }
    });
  }

  private loadSymptoms(): void {
    this.doctorSymptomsService.getPatientSymptoms(this.patientId).subscribe({
      next: (submissions) => {
        this.submissions = submissions;
        this.selectedSubmission = submissions[0] ?? null;
        this.buildCharts();
        this.rebuildSelectedStatsChart();
        this.isLoadingVitalsHistory = false;
        this.vitalsHistoryError = '';
        this.isLoadingSymptoms = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load symptoms and vital signs.';
        this.isLoadingVitalsHistory = false;
        this.vitalsHistoryError = 'Unable to build vitals charts.';
        this.isLoadingSymptoms = false;
      }
    });
  }

  private buildCharts(): void {
    if (this.submissions.length < 2) {
      this.temperatureData = [];
      this.heartRateData = [];
      this.bpData = [];
      this.spo2Data = [];

      this.temperatureChartData = this.createEmptyLineChartData('Temperature (degC)');
      this.heartRateChartData = this.createEmptyLineChartData('Heart Rate (bpm)');
      this.bloodPressureChartData = {
        labels: [],
        datasets: [
          this.createEmptyLineDataset('Systolic (mmHg)', this.normalColor),
          this.createEmptyLineDataset('Diastolic (mmHg)', '#0ea5e9'),
        ]
      };
      this.spo2ChartData = this.createEmptyLineChartData('SpO2 (%)');
      return;
    }

    const sortedSubmissions = [...this.submissions].sort(
      (first, second) => this.getDateTimestamp(this.getSubmissionDate(first)) - this.getDateTimestamp(this.getSubmissionDate(second))
    );

    this.temperatureData = sortedSubmissions
      .map((submission) => ({
        date: this.getSubmissionDate(submission),
        value: this.extractTemperature(submission)
      }))
      .filter((row): row is { date: string; value: number } => !!row.date && row.value !== null);

    this.heartRateData = sortedSubmissions
      .map((submission) => ({
        date: this.getSubmissionDate(submission),
        value: this.extractHeartRate(submission)
      }))
      .filter((row): row is { date: string; value: number } => !!row.date && row.value !== null);

    this.bpData = sortedSubmissions
      .map((submission) => {
        const bp = this.extractBloodPressure(submission);
        return {
          date: this.getSubmissionDate(submission),
          systolic: bp?.systolic ?? null,
          diastolic: bp?.diastolic ?? null,
        };
      })
      .filter((row): row is { date: string; systolic: number; diastolic: number } =>
        !!row.date && row.systolic !== null && row.diastolic !== null
      );

    this.spo2Data = sortedSubmissions
      .map((submission) => ({
        date: this.getSubmissionDate(submission),
        value: this.extractSpo2(submission)
      }))
      .filter((row): row is { date: string; value: number } => !!row.date && row.value !== null);

    this.temperatureChartData = {
      labels: this.temperatureData.map((row) => this.formatChartDate(row.date)),
      datasets: [
        this.createThresholdLineDataset(
          'Temperature (degC)',
          this.temperatureData.map((row) => row.value),
          (value) => value > 38
        )
      ]
    };

    this.heartRateChartData = {
      labels: this.heartRateData.map((row) => this.formatChartDate(row.date)),
      datasets: [
        this.createThresholdLineDataset(
          'Heart Rate (bpm)',
          this.heartRateData.map((row) => row.value),
          (value) => value > 100
        )
      ]
    };

    this.bloodPressureChartData = {
      labels: this.bpData.map((row) => this.formatChartDate(row.date)),
      datasets: [
        this.createThresholdLineDataset(
          'Systolic (mmHg)',
          this.bpData.map((row) => row.systolic),
          (value) => value > 140,
          this.normalColor
        ),
        this.createThresholdLineDataset(
          'Diastolic (mmHg)',
          this.bpData.map((row) => row.diastolic),
          (value) => value > 90,
          '#0ea5e9'
        )
      ]
    };

    this.spo2ChartData = {
      labels: this.spo2Data.map((row) => this.formatChartDate(row.date)),
      datasets: [
        this.createThresholdLineDataset(
          'SpO2 (%)',
          this.spo2Data.map((row) => row.value),
          (value) => value < 95
        )
      ]
    };

    this.updateSpo2AxisScale();
  }

  private rebuildSelectedStatsChart(): void {
    switch (this.selectedStatsType) {
      case 'temperature':
        this.rebuildTemperatureStatsChart();
        return;
      case 'heartRate':
        this.rebuildHeartRateStatsChart();
        return;
      case 'bloodPressure':
        this.rebuildBloodPressureStatsChart();
        return;
      default:
        this.rebuildSpo2StatsChart();
    }
  }

  private rebuildTemperatureStatsChart(): void {
    const rows = this.getFilteredRows(this.temperatureData);
    const labels = rows.map((row) => this.formatChartDate(row.date));
    const values = rows.map((row) => row.value);

    this.selectedStatsChartData = {
      labels,
      datasets: [
        this.createThresholdLineDataset('Temperature (degC)', values, (value) => value > 38),
      ],
    };
    this.selectedStatsChartOptions = this.createLineChartOptions('Temperature (degC)');
    this.setSingleValueKpis(values, 'degC');
    this.setTemperatureInterpretation(values);
  }

  private rebuildHeartRateStatsChart(): void {
    const rows = this.getFilteredRows(this.heartRateData);
    const labels = rows.map((row) => this.formatChartDate(row.date));
    const values = rows.map((row) => row.value);

    this.selectedStatsChartData = {
      labels,
      datasets: [
        this.createThresholdLineDataset('Heart Rate (bpm)', values, (value) => value > 100 || value < 60),
      ],
    };
    this.selectedStatsChartOptions = this.createLineChartOptions('Heart Rate (bpm)');
    this.setSingleValueKpis(values, 'bpm');
    this.setHeartRateInterpretation(values);
  }

  private rebuildBloodPressureStatsChart(): void {
    const rows = this.getFilteredRows(this.bpData);
    const labels = rows.map((row) => this.formatChartDate(row.date));
    const systolic = rows.map((row) => row.systolic);
    const diastolic = rows.map((row) => row.diastolic);

    this.selectedStatsChartData = {
      labels,
      datasets: [
        this.createThresholdLineDataset('Systolic (mmHg)', systolic, (value) => value >= 140, this.normalColor),
        this.createThresholdLineDataset('Diastolic (mmHg)', diastolic, (value) => value >= 90, '#0ea5e9'),
      ],
    };
    this.selectedStatsChartOptions = this.createLineChartOptions('Blood Pressure (mmHg)', true);

    if (rows.length === 0) {
      this.selectedStatsLastValue = '-';
      this.selectedStatsAverage = '-';
      this.selectedStatsRange = '-';
      this.selectedStatsMeasures = 0;
      this.selectedStatsInterpretation = 'No blood pressure data available for interpretation.';
      this.selectedStatsInterpretationWarning = false;
      return;
    }

    const last = rows[rows.length - 1];
    const avgSystolic = this.average(systolic);
    const avgDiastolic = this.average(diastolic);
    const minSystolic = Math.min(...systolic);
    const maxSystolic = Math.max(...systolic);
    const minDiastolic = Math.min(...diastolic);
    const maxDiastolic = Math.max(...diastolic);

    this.selectedStatsLastValue = `${Math.round(last.systolic)}/${Math.round(last.diastolic)} mmHg`;
    this.selectedStatsAverage = `${Math.round(avgSystolic)}/${Math.round(avgDiastolic)} mmHg`;
    this.selectedStatsRange = `S ${Math.round(minSystolic)}-${Math.round(maxSystolic)} / D ${Math.round(minDiastolic)}-${Math.round(maxDiastolic)}`;
    this.selectedStatsMeasures = rows.length;
    this.setBloodPressureInterpretation(last.systolic, last.diastolic);
  }

  private rebuildSpo2StatsChart(): void {
    const rows = this.getFilteredRows(this.spo2Data);
    const labels = rows.map((row) => this.formatChartDate(row.date));
    const values = rows.map((row) => row.value);

    this.selectedStatsChartData = {
      labels,
      datasets: [
        this.createThresholdLineDataset('SpO2 (%)', values, (value) => value < 95),
        {
          label: 'Clinical threshold (95%)',
          data: values.map(() => 95),
          borderColor: '#f59e0b',
          borderDash: [6, 6],
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 0,
          fill: false,
        },
      ],
    };
    this.selectedStatsChartOptions = this.createSpo2StatsOptions(values);
    this.setSingleValueKpis(values, '%');
    this.setSpo2Interpretation(values);
  }

  private setSingleValueKpis(values: number[], unit: string): void {
    if (values.length === 0) {
      this.selectedStatsLastValue = '-';
      this.selectedStatsAverage = '-';
      this.selectedStatsRange = '-';
      this.selectedStatsMeasures = 0;
      return;
    }

    const last = values[values.length - 1];
    const avg = this.average(values);
    const min = Math.min(...values);
    const max = Math.max(...values);

    this.selectedStatsLastValue = `${this.formatNumber(last)} ${unit}`;
    this.selectedStatsAverage = `${this.formatNumber(avg)} ${unit}`;
    this.selectedStatsRange = `${this.formatNumber(min)} - ${this.formatNumber(max)} ${unit}`;
    this.selectedStatsMeasures = values.length;
  }

  private setSpo2Interpretation(values: number[]): void {
    if (values.length === 0) {
      this.selectedStatsInterpretation = 'No SpO2 data available for interpretation.';
      this.selectedStatsInterpretationWarning = false;
      return;
    }

    const last = values[values.length - 1];
    if (last < 95) {
      this.selectedStatsInterpretation = 'Critical warning: Latest SpO2 is below 95%. Assess oxygenation and clinical status urgently.';
      this.selectedStatsInterpretationWarning = true;
      return;
    }

    this.selectedStatsInterpretation = 'Stable status: Latest SpO2 is within acceptable range.';
    this.selectedStatsInterpretationWarning = false;
  }

  private setTemperatureInterpretation(values: number[]): void {
    if (values.length === 0) {
      this.selectedStatsInterpretation = 'No temperature data available for interpretation.';
      this.selectedStatsInterpretationWarning = false;
      return;
    }

    const last = values[values.length - 1];
    if (last > 38) {
      this.selectedStatsInterpretation = 'Fever warning: Latest temperature is above 38 degC.';
      this.selectedStatsInterpretationWarning = true;
      return;
    }

    this.selectedStatsInterpretation = 'Stable status: Latest temperature is within normal range.';
    this.selectedStatsInterpretationWarning = false;
  }

  private setHeartRateInterpretation(values: number[]): void {
    if (values.length === 0) {
      this.selectedStatsInterpretation = 'No heart rate data available for interpretation.';
      this.selectedStatsInterpretationWarning = false;
      return;
    }

    const last = values[values.length - 1];
    if (last > 100 || last < 60) {
      this.selectedStatsInterpretation = 'Abnormal pulse warning: Latest heart rate is outside the 60-100 bpm range.';
      this.selectedStatsInterpretationWarning = true;
      return;
    }

    this.selectedStatsInterpretation = 'Stable status: Latest heart rate is in expected range.';
    this.selectedStatsInterpretationWarning = false;
  }

  private setBloodPressureInterpretation(lastSystolic: number, lastDiastolic: number): void {
    if (lastSystolic >= 140 || lastDiastolic >= 90) {
      this.selectedStatsInterpretation = 'Hypertension warning: Latest blood pressure is above recommended threshold.';
      this.selectedStatsInterpretationWarning = true;
      return;
    }

    this.selectedStatsInterpretation = 'Stable status: Latest blood pressure is within expected range.';
    this.selectedStatsInterpretationWarning = false;
  }

  private getFilteredRows<T extends { date: string }>(rows: T[]): T[] {
    if (this.selectedStatsPeriod === 'all') {
      return rows;
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 6);

    return rows.filter((row) => {
      const rowDate = new Date(row.date);
      if (Number.isNaN(rowDate.getTime())) {
        return false;
      }

      if (this.selectedStatsPeriod === 'today') {
        return (
          rowDate.getFullYear() === todayStart.getFullYear() &&
          rowDate.getMonth() === todayStart.getMonth() &&
          rowDate.getDate() === todayStart.getDate()
        );
      }

      return rowDate >= weekStart && rowDate <= now;
    });
  }

  private createSpo2StatsOptions(values: number[]): ChartOptions<'line'> {
    if (values.length === 0) {
      return {
        ...this.createLineChartOptions('SpO2 (%)', true),
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b7280', maxRotation: 0, autoSkip: true },
          },
          y: {
            min: 90,
            max: 100,
            grid: { color: 'rgba(148, 163, 184, 0.2)' },
            ticks: { color: '#6b7280', stepSize: 1 },
            title: {
              display: true,
              text: 'SpO2 (%)',
              color: '#64748b',
              font: { size: 11 },
            },
          },
        },
      };
    }

    let min = Math.floor(Math.min(...values) - 1);
    let max = Math.ceil(Math.max(...values) + 1);
    min = Math.max(85, min);
    max = Math.min(100, max);

    if (max - min < 4) {
      const mid = (max + min) / 2;
      min = Math.max(85, Math.floor(mid - 2));
      max = Math.min(100, Math.ceil(mid + 2));
    }

    return {
      ...this.createLineChartOptions('SpO2 (%)', true),
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', maxRotation: 0, autoSkip: true },
        },
        y: {
          min,
          max,
          grid: { color: 'rgba(148, 163, 184, 0.2)' },
          ticks: { color: '#6b7280', stepSize: 1 },
          title: {
            display: true,
            text: 'SpO2 (%)',
            color: '#64748b',
            font: { size: 11 },
          },
        },
      },
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private formatNumber(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  }

  private getSubmissionDate(submission: DoctorSymptomsSubmission): string {
    return String(submission.createdAt ?? submission.submittedAt ?? submission.updatedAt ?? '');
  }

  private extractTemperature(submission: DoctorSymptomsSubmission): number | null {
    const row = submission.vitalSigns.find((item) => item.label.toLowerCase().includes('temp'));
    return row ? this.toNumber(row.value) : null;
  }

  private extractHeartRate(submission: DoctorSymptomsSubmission): number | null {
    const row = submission.vitalSigns.find((item) => item.label.toLowerCase().includes('heart') || item.label.toLowerCase().includes('pulse'));
    return row ? this.toNumber(row.value) : null;
  }

  private extractSpo2(submission: DoctorSymptomsSubmission): number | null {
    const isSpo2Label = (label: string): boolean => {
      const normalized = this.normalizeLabel(label);
      return (
        normalized.includes('spo2') ||
        normalized.includes('sao2') ||
        normalized.includes('oxygen') ||
        normalized.includes('oxygene') ||
        normalized.includes('saturation') ||
        normalized.includes('oxymetrie') ||
        normalized.includes('oximetry')
      );
    };

    const vitalRow = submission.vitalSigns.find((item) => isSpo2Label(item.label));
    const symptomRow = submission.symptoms.find((item) => isSpo2Label(item.label));
    const raw = vitalRow?.value ?? symptomRow?.value;
    if (raw === undefined || raw === null) {
      return null;
    }

    let value = this.toNumber(raw);
    if (value === null) {
      return null;
    }

    // Some APIs send SpO2 as ratio (0.96) instead of percent (96).
    if (value > 0 && value <= 1) {
      value *= 100;
    }

    // Guard against mis-mapped values from unrelated questions.
    if (value < 50 || value > 100) {
      return null;
    }

    return value;
  }

  private extractBloodPressure(submission: DoctorSymptomsSubmission): { systolic: number; diastolic: number } | null {
    const row = submission.vitalSigns.find((item) => item.label.toLowerCase().includes('blood pressure') || item.label.toLowerCase().includes('pressure'));
    if (!row) {
      return null;
    }

    const [systolicRaw, diastolicRaw] = String(row.value).split('/');
    const systolic = Number(systolicRaw);
    const diastolic = Number(diastolicRaw);
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
      return null;
    }

    return { systolic, diastolic };
  }

  private toNumber(value: unknown): number | null {
    const text = String(value ?? '');
    const match = text.match(/-?\d+([.,]\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0].replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeLabel(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  private updateSpo2AxisScale(): void {
    const values = this.spo2Data
      .map((row) => row.value)
      .filter((value): value is number => Number.isFinite(value));

    if (values.length === 0) {
      this.applySpo2Scale(90, 100);
      return;
    }

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = 1;

    // Auto zoom around the recorded SpO2 values with safe clinical bounds.
    let min = Math.floor(minValue - padding);
    let max = Math.ceil(maxValue + padding);

    min = Math.max(85, min);
    max = Math.min(100, max);

    // Keep at least a small visual range.
    if (max - min < 4) {
      const mid = (max + min) / 2;
      min = Math.max(85, Math.floor(mid - 2));
      max = Math.min(100, Math.ceil(mid + 2));
    }

    this.applySpo2Scale(min, max);
  }

  private applySpo2Scale(min: number, max: number): void {
    this.spo2ChartOptions = {
      ...this.spo2ChartOptions,
      scales: {
        ...this.spo2ChartOptions.scales,
        y: {
          ...(this.spo2ChartOptions.scales?.['y'] as object),
          min,
          max,
          ticks: {
            ...((this.spo2ChartOptions.scales?.['y'] as any)?.ticks ?? {}),
            stepSize: 1,
          },
        },
      },
    };
  }

  private getDateTimestamp(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private formatChartDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  private createLineChartOptions(yAxisTitle: string, showLegend = false): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: showLegend,
          labels: {
            usePointStyle: true,
            boxHeight: 8,
            boxWidth: 8,
          },
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const value = context.parsed.y;
              return `${context.dataset.label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#6b7280',
            maxRotation: 0,
            autoSkip: true,
          },
        },
        y: {
          grid: {
            color: 'rgba(148, 163, 184, 0.2)',
          },
          ticks: {
            color: '#6b7280',
          },
          title: {
            display: true,
            text: yAxisTitle,
            color: '#64748b',
            font: {
              size: 11,
            },
          },
        },
      },
      elements: {
        point: {
          hoverRadius: 6,
        },
      },
    };
  }

  private createEmptyLineChartData(label: string): ChartData<'line'> {
    return {
      labels: [],
      datasets: [this.createEmptyLineDataset(label, this.normalColor)]
    };
  }

  private createEmptyLineDataset(label: string, color: string): ChartDataset<'line'> {
    return {
      label,
      data: [],
      borderColor: color,
      backgroundColor: color,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: false,
      spanGaps: true,
    };
  }

  private createThresholdLineDataset(
    label: string,
    values: Array<number | null>,
    isAbnormal: (value: number) => boolean,
    normalColor = this.normalColor
  ): ChartDataset<'line'> {
    return {
      label,
      data: values,
      borderColor: normalColor,
      backgroundColor: normalColor,
      pointBackgroundColor: values.map((value) =>
        value !== null && isAbnormal(value) ? this.abnormalColor : normalColor
      ),
      pointBorderColor: values.map((value) =>
        value !== null && isAbnormal(value) ? this.abnormalColor : normalColor
      ),
      segment: {
        borderColor: (context) => {
          const value = context.p1.parsed.y as number | null;
          return value !== null && isAbnormal(value) ? this.abnormalColor : normalColor;
        },
      },
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
      fill: false,
      spanGaps: true,
    };
  }
}
