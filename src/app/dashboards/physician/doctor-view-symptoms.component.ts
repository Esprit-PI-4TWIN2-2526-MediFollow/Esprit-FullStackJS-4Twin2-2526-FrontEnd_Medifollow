import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Users } from '../../models/users';
import { UsersService } from '../../services/user/users.service';
import {
  DoctorSymptomsService,
  DoctorSymptomsSubmission
} from '../../services/doctor-symptoms.service';
import { AiAnalysis } from '../../models/ai-analysis';
import { AiAnalysisService } from '../../services/ai-analysis.service';

@Component({
  selector: 'app-doctor-view-symptoms',
  templateUrl: './doctor-view-symptoms.component.html',
  styleUrl: './doctor-view-symptoms.component.css'
})
export class DoctorViewSymptomsComponent implements OnInit {
  patientId = '';
  patient: Users | null = null;
  submissions: DoctorSymptomsSubmission[] = [];
  selectedSubmission: DoctorSymptomsSubmission | null = null;
  isLoadingPatient = true;
  isLoadingSymptoms = true;
  errorMessage = '';
// === NOUVEAU AI ANALYSIS ===
  aiAnalysis: AiAnalysis | null = null;
  isLoadingAnalysis = false;
  analysisError = '';


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

// === NOUVELLE MÉTHODE AI ANALYSIS ===
  loadAiAnalysis(submission: DoctorSymptomsSubmission): void {
    if (!submission || !submission.answers || submission.answers.length === 0) {
      this.analysisError = 'Aucune réponse disponible pour générer l\'analyse IA.';
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
        error: (err) => {
          console.error('Erreur génération analyse IA', err);
          this.analysisError = 'Impossible de générer l\'analyse IA pour le moment. Veuillez réessayer.';
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
    case 'high':     return 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/30';
    default:         return 'border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30';
  }
}

getFindingValueClass(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-red-600 dark:text-red-400';
    case 'high':     return 'text-orange-600 dark:text-orange-400';
    default:         return 'text-amber-600 dark:text-amber-400';
  }
}

getFindingIconClass(severity: string): string {
  if (severity === 'critical') return 'text-red-500';
  if (severity === 'high') return 'text-orange-500';
  return 'text-amber-500';
}


// getAbnormalVitals(): { label: string; value: string; status: string; isAlert: boolean }[] {
//   if (!this.aiAnalysis?.features) return [];
//   const f = this.aiAnalysis.features;
//   const vitals = [];

//   if (f.spo2 != null)
//     vitals.push({ label: 'SpO2', value: `${f.spo2}%`,
//       status: f.spo2 < 94 ? 'Hypoxemia' : 'Normal', isAlert: f.spo2 < 94 });

//   if (f.pain_level != null)
//     vitals.push({ label: 'Pain level', value: `${f.pain_level} / 10`,
//       status: f.pain_level >= 7 ? 'Severe' : f.pain_level >= 4 ? 'Moderate' : 'Mild',
//       isAlert: f.pain_level >= 7 });

//   if (f.heart_rate != null)
//     vitals.push({ label: 'Heart rate', value: `${f.heart_rate} bpm`,
//       status: f.heart_rate > 100 ? 'Tachycardia' : 'Normal', isAlert: f.heart_rate > 100 });

//   if (f.temperature != null)
//     vitals.push({ label: 'Temperature', value: `${f.temperature}°C`,
//       status: f.temperature > 38.0 ? 'Fever' : 'Normal', isAlert: f.temperature > 38.0 });

//   if (f.consciousness != null)
//     vitals.push({ label: 'Consciousness', value: `${f.consciousness} / 10`,
//       status: f.consciousness < 6 ? 'Altered' : 'Normal', isAlert: f.consciousness < 6 });

//   if (f.bp_systolic != null && f.bp_diastolic != null)
//     vitals.push({ label: 'Blood pressure', value: `${f.bp_systolic}/${f.bp_diastolic}`,
//       status: f.bp_systolic < 90 ? 'Hypotension' : 'Normal', isAlert: f.bp_systolic < 90 });

//   return vitals;
// }

getRecommendations(): { title: string; detail: string }[] {
  if (!this.aiAnalysis?.gravity) return [];
  const g = this.aiAnalysis.gravity;

  if (g === 'critical') return [
    { title: 'Urgent medical evaluation', detail: 'Immediate physician assessment required' },
    { title: 'Continuous vital monitoring', detail: 'Do not leave patient unattended' },
    { title: 'Consider hospitalization', detail: 'Evaluate need for immediate admission' },
  ];
  if (g === 'high') return [
    { title: 'Close monitoring required', detail: 'Re-evaluate vitals within 1–2 hours' },
    { title: 'Full re-evaluation recommended', detail: 'Review treatment plan and adjust accordingly' },
  ];
  if (g === 'medium') return [
    { title: 'Enhanced monitoring', detail: 'Re-check vitals within 4 hours' },
    { title: 'Maintain daily follow-up', detail: 'Continue standard protocol with attention' },
  ];
  return [
    { title: 'Standard follow-up', detail: 'Next check-up according to service protocol' },
  ];
}

//======================================//

  selectSubmission(submission: DoctorSymptomsSubmission): void {
    this.selectedSubmission = submission;
    this.aiAnalysis = null;           // reset
    this.analysisError = '';
// Génère l'analyse IA automatiquement quand on sélectionne une soumission
    this.loadAiAnalysis(submission);
  }

  isSelected(submission: DoctorSymptomsSubmission): boolean {
    return this.selectedSubmission?._id === submission._id;
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
        this.isLoadingSymptoms = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load symptoms and vital signs.';
        this.isLoadingSymptoms = false;
      }
    });
  }
}

