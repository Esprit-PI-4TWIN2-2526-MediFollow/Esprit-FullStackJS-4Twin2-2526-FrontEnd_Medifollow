import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TwoFactorService } from '../../../../services/auth/two-factor.service';
import { TwoFactorSetupResponse } from '../../../../models/two-factor';

@Component({
  selector: 'app-two-factor-auth-card',
  templateUrl: './two-factor-auth-card.component.html',
  styles: ``,
})
export class TwoFactorAuthCardComponent implements OnInit {
  isLoadingStatus = true;
  isSettingUp = false;
  isEnabling = false;
  isDisabling = false;

  twoFactorEnabled = false;
  setupData: TwoFactorSetupResponse | null = null;

  errorMessage = '';
  successMessage = '';

  enableForm: FormGroup;
  disableForm: FormGroup;

  constructor(private fb: FormBuilder, private twoFactorService: TwoFactorService) {
    this.enableForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.disableForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });
  }

  ngOnInit(): void {
    this.refreshStatus();
  }

  refreshStatus(): void {
    this.isLoadingStatus = true;
    this.twoFactorService.getStatus().subscribe({
      next: (res) => {
        this.twoFactorEnabled = !!res.twoFactorEnabled;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load 2FA status.';
      },
      complete: () => {
        this.isLoadingStatus = false;
      },
    });
  }

  startSetup(): void {
    if (this.isSettingUp) return;

    this.errorMessage = '';
    this.successMessage = '';
    this.isSettingUp = true;
    this.setupData = null;
    this.enableForm.reset();

    this.twoFactorService.setup().subscribe({
      next: (res) => {
        this.setupData = res;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to start 2FA setup.';
      },
      complete: () => {
        this.isSettingUp = false;
      },
    });
  }

  cancelSetup(): void {
    this.setupData = null;
    this.enableForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  enable2fa(): void {
    if (this.enableForm.invalid || this.isEnabling) {
      this.enableForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isEnabling = true;

    const code = String(this.enableForm.value.code || '').trim();

    this.twoFactorService.enable({ code }).subscribe({
      next: (res) => {
        this.twoFactorEnabled = !!res.twoFactorEnabled;
        this.setupData = null;
        this.enableForm.reset();
        this.successMessage = 'Two-factor authentication enabled.';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to enable 2FA.';
      },
      complete: () => {
        this.isEnabling = false;
        this.refreshStatus();
      },
    });
  }

  disable2fa(): void {
    if (this.disableForm.invalid || this.isDisabling) {
      this.disableForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isDisabling = true;

    const code = String(this.disableForm.value.code || '').trim();

    this.twoFactorService.disable({ code }).subscribe({
      next: (res) => {
        this.twoFactorEnabled = !!res.twoFactorEnabled;
        this.disableForm.reset();
        this.successMessage = 'Two-factor authentication disabled.';
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to disable 2FA.';
      },
      complete: () => {
        this.isDisabling = false;
        this.refreshStatus();
      },
    });
  }
}
