import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-first-login-change-password',
  templateUrl: './first-login-change-password.component.html',
})
export class FirstLoginChangePasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  loading = false;
  successMessage = '';
  errorMessage = '';
  infoMessage = '';
  onboardingToken = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.onboardingToken = this.authService.getOnboardingToken() || '';

    if (!this.onboardingToken) {
      this.router.navigate(['/signin'], {
        queryParams: {
          message:
            'First-login session is invalid or expired. Please sign in again.',
        },
      });
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      this.infoMessage = params.get('message') || '';
    });
  }

  onSubmit(): void {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.onboardingToken) {
      this.router.navigate(['/signin'], {
        queryParams: {
          message:
            'First-login session is invalid or expired. Please sign in again.',
        },
      });
      return;
    }

    if (!this.newPassword || this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Password confirmation does not match.';
      return;
    }

    this.loading = true;
    this.authService
      .changePasswordOnFirstLogin({
        onboardingToken: this.onboardingToken,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (response) => {
          this.successMessage =
            response.message ||
            'Password updated and account activated successfully.';
          this.authService.persistAuthSession(response.accessToken, response.user);
          this.authService.clearOnboardingToken();
          this.router.navigate([this.authService.getPostLoginRoute(response.user)]);
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.message ||
            'Unable to update password. Please try again.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
