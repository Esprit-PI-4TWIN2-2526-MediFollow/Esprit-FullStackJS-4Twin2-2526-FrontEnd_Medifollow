import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Alert } from '../../../models/alert';
import { AlertService } from '../../../services/alert.service';
import { Users } from '../../../models/users';
import { UsersService } from '../../../services/user/users.service';

@Component({
  selector: 'app-view-alert',
  templateUrl: './view-alert.component.html',
  styleUrl: './view-alert.component.css'
})
export class ViewAlertComponent implements OnInit {

  alerts: Alert[] = [];
  alert: Alert | null = null;
  isLoading = true;
  errorMessage = '';
patient: Users | null = null;
  isLoadingPatient = true;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private usersService: UsersService
  ) {}

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('patientId');
    const alertId = this.route.snapshot.paramMap.get('id');

    if (patientId) {
      this.loadPatient(patientId);
      this.loadAlertsByPatient(patientId);
      return;
    }

    if (alertId) {
      this.loadAlertById(alertId);
      return;
    }

    this.errorMessage = 'No alert ID or patient ID provided';
    this.isLoading = false;
  }


  // ── Load patient info ───────────────────────────────────

  loadPatient(patientId: string): void {
    if (!patientId) {
      this.isLoadingPatient = false;
      return;
    }

    this.isLoadingPatient = true;
    this.usersService.getUserById(patientId).subscribe({
      next: (user) => {
        this.patient = user;
        this.isLoadingPatient = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load patient information.';
        this.isLoadingPatient = false;
      }
    });
  }
 getUserInitials(): string {
    if (!this.patient) return '?';
    const f = this.patient.firstName?.charAt(0) || '';
    const l = this.patient.lastName?.charAt(0) || '';
    return (f + l).toUpperCase();
  }

  loadAlertsByPatient(patientId: string): void {
    this.isLoading = true;
    this.alertService.getAlertsByPatient(patientId).subscribe({
      next: (alertData) => {
        this.alerts = alertData || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load alerts for this patient';
        this.isLoading = false;
      }
    });
  }

  loadAlertById(alertId: string): void {
    this.isLoading = true;
    this.alertService.getAlertById(alertId).subscribe({
      next: (alertData) => {
        this.alert = alertData;
        this.isLoading = false;

        if (alertData && !alertData.isRead) {
          this.markAsRead(alertData._id);
        }
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load alert details';
        this.isLoading = false;
      }
    });
  }

getAlertCardClass(severity: string, isRead: boolean): string {
  if (isRead) return 'border-gray-100 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] opacity-70';
  const map: Record<string, string> = {
    critical: 'border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/20',
    high:     'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20',
    medium:   'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
    low:      'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
  };
  return map[severity] || map['low'];
}

getSeverityTextClass(severity: string): string {
  const map: Record<string, string> = {
    critical: 'text-error-600 dark:text-error-400',
    high:     'text-orange-600 dark:text-orange-400',
    medium:   'text-amber-600 dark:text-amber-400',
    low:      'text-blue-600 dark:text-blue-400',
  };
  return map[severity] || map['low'];
}

getSeverityDotClass(severity: string): string {
  const map: Record<string, string> = {
    critical: 'bg-error-500',
    high:     'bg-orange-500',
    medium:   'bg-amber-500',
    low:      'bg-blue-500',
  };
  return map[severity] || 'bg-blue-500';
}

  // loadAlert(alertId: string): void {
  //   this.isLoading = true;
  //   this.alertService.getAlertById(alertId).subscribe({
  //     next: (alertData) => {
  //       this.alert = alertData;
  //       this.isLoading = false;

  //       // Mark as read automatically when viewed
  //       if (alertData && !alertData.isRead) {
  //         this.markAsRead(alertData._id);
  //       }
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.errorMessage = 'Failed to load alert details';
  //       this.isLoading = false;
  //     }
  //   });
  // }

  markAsRead(alertId: string): void {
    this.alertService.markAsRead(alertId).subscribe({
      next: () => {
        if (this.alert && this.alert._id === alertId) {
          this.alert.isRead = true;
        }
        const index = this.alerts.findIndex(a => a._id === alertId);
        if (index !== -1) {
          this.alerts[index].isRead = true;
        }
      },
      error: (err) => console.error('Error marking alert as read', err)
    });
  }

  goBack(): void {
    this.router.navigate(['/doctor/dashboard']);
  }

  viewPatientResponses(patientId?: string): void {
    if (patientId) {
      this.router.navigate(['/doctor/patient', patientId, 'symptoms']);
    }
  }

  getSeverityClass(severity: string = 'low'): string {
    const map: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400',
      high:     'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400',
      medium:   'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400',
      low:      'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return map[severity.toLowerCase()] || map['low'];
  }
}
