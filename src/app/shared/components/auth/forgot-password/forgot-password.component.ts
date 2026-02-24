import { Component } from '@angular/core';
import { AuthPasswordService } from '../../../../services/auth-password.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authPasswordService: AuthPasswordService) {}

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.email) {
      this.errorMessage = 'Email is required.';
      return;
    }

    this.loading = true;
    this.authPasswordService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.successMessage = response?.message || 'Reset email sent successfully.';
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Failed to send reset email.';
        this.loading = false;
      },
    });
  }

}
