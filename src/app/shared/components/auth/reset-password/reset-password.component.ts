import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthPasswordService } from '../../../../services/auth-password.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  token = '';
  password = '';
  confirmPassword = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authPasswordService: AuthPasswordService
  ) {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.token) {
      this.errorMessage = 'Reset token is missing.';
      return;
    }

    if (!this.password || this.password.length < 6) {
      this.errorMessage = 'Password must contain at least 6 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.authPasswordService.resetPassword(this.token, this.password).subscribe({
      next: (response) => {
        this.successMessage = response?.message || 'Password reset successful.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/signin']), 1200);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to reset password.';
        this.loading = false;
      },
    });
  }
}
