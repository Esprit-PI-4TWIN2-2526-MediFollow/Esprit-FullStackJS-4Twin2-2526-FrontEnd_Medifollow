
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/users.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

type RoleKey = 'patient' | 'doctor' | 'nurse' | 'coordinator' | 'auditor' | 'admin';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styles: `
    :host ::ng-deep .flatpickr-calendar.flatpickr-theme-green {
      border: 1px solid #10b981;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);
    }

    :host ::ng-deep .flatpickr-theme-green .flatpickr-months .flatpickr-month,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-weekdays {
      background: #ecfdf5;
    }

    :host ::ng-deep .flatpickr-theme-green .flatpickr-current-month .flatpickr-monthDropdown-months,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-current-month input.cur-year,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-weekday {
      color: #065f46;
      font-weight: 600;
    }

    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.selected,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.startRange,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.endRange {
      background: #10b981;
      border-color: #10b981;
      color: #ffffff;
    }

    :host ::ng-deep .flatpickr-theme-green .flatpickr-day:hover {
      background: #d1fae5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.today {
      border-color: #10b981;
      color: #047857;
    }

    :host ::ng-deep .flatpickr-theme-green .flatpickr-prev-month:hover svg,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-next-month:hover svg {
      fill: #10b981;
    }
  `,
})
export class SignupFormComponent implements OnInit {

signupForm!:FormGroup;
users!:Users[];
message: string = '';
  error: string = '';
  step = 1;
  carouselStart = 0;
  readonly visibleRoles = 5;

  showPassword = false;
  isChecked = false;
  showPasswordStrength = false;
  passwordStrengthPercent = 0;
  passwordStrengthLabel = 'Weak';
  passwordStrengthClass = 'bg-error-500';
  selectedRole: RoleKey | null = null;
  minDateOfBirth = '';
  maxDateOfBirth = '';
  private readonly stepOneControlNames = ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'sexe', 'address', 'dateOfBirth'];

constructor(private usersService: UsersService,private fb:FormBuilder,private router:Router) {}

  roles = [
    { key: 'nurse' as const, label: 'Nurse' },
    { key: 'doctor' as const, label: 'Doctor' },
    { key: 'coordinator' as const, label: 'Coordinator' },
    { key: 'auditor' as const, label: 'Auditor' },
    { key: 'patient' as const, label: 'Patient' },
    { key: 'admin' as const, label: 'Admin' },
  ];

  departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Emergency'];
  doctors = ['Dr. Ahmed Ben Ali', 'Dr. Salma Trabelsi', 'Dr. Youssef Gharbi', 'Dr. Ines Jaziri'];
  auditScopes = ['Logs', 'Data', 'Full Access'];
  sexeOptions = ['Male', 'Female'];

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    sexe: '',
    address: '',
    dateOfBirth: '',
    primaryDoctor: '',
    specialization: '',
    grade: '',
    diploma: '',
    yearsOfExperience: null as number | null,
    assignedDepartment: '',
    auditScope: '',
  };
  profileImageName = '';

// Get the currently displayed roles based on carousel position
  get displayedRoles() {
    return this.roles.slice(this.carouselStart, this.carouselStart + this.visibleRoles);
  }

// Get the display title for the currently selected role
  get roleTitle(): string {
    const role = this.roles.find((r) => r.key === this.selectedRole);
    return role ? role.label : 'Role';
  }
// Get the initial letter for a role label (used in carousel display)
  roleInitial(label: string): string {
    return label.charAt(0).toUpperCase();
  }
// Navigate to previous set of roles in the carousel
  prevRoles() {
    if (this.carouselStart > 0) this.carouselStart -= 1;
  }
// Navigate to next set of roles in the carousel
  nextRoles() {
    if (this.carouselStart + this.visibleRoles < this.roles.length) this.carouselStart += 1;
  }
// Handle role selection and move to next step
  selectRole(role: RoleKey) {
    this.selectedRole = role;
  }

// Validate step one controls and proceed to step two if valid
  continueToStepTwo() {
    if (!this.selectedRole) return;

    this.markControlsAsTouched(this.stepOneControlNames);
    const hasInvalidStepOneControl = this.stepOneControlNames.some(
      (controlName) => this.signupForm.get(controlName)?.invalid
    );

    if (hasInvalidStepOneControl) {
      Swal.fire('Form invalid', 'Please complete valid common information before continuing.', 'error');
      return;
    }

    this.step = 2;
  }

  backToRoleSelection() {
    this.step = 1;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  generateRandomPassword(minLength: number = 6): void {
    const length = Math.max(minLength, 10);
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = lowercase + uppercase + numbers + symbols;

    const requiredChars = [
      lowercase[Math.floor(Math.random() * lowercase.length)],
      uppercase[Math.floor(Math.random() * uppercase.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    const randomChars = Array.from({ length: length - requiredChars.length }, () =>
      allChars[Math.floor(Math.random() * allChars.length)]
    );

    const password = [...requiredChars, ...randomChars]
      .sort(() => Math.random() - 0.5)
      .join('');

    this.signupForm.get('password')?.setValue(password);
    this.signupForm.get('password')?.markAsDirty();
    this.signupForm.get('password')?.markAsTouched();
    this.showPasswordStrength = false;
    this.showPassword = true;
  }

  onPasswordManualInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.showPasswordStrength = true;
    this.updatePasswordStrength(input.value || '');
  }

  private updatePasswordStrength(password: string): void {
    let score = 0;

    if (password.length >= 6) score += 25;
    if (password.length >= 10) score += 15;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
    if (/\d/.test(password)) score += 20;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;

    this.passwordStrengthPercent = Math.min(score, 100);

    if (this.passwordStrengthPercent < 40) {
      this.passwordStrengthLabel = 'Weak';
      this.passwordStrengthClass = 'bg-error-500';
    } else if (this.passwordStrengthPercent < 70) {
      this.passwordStrengthLabel = 'Medium';
      this.passwordStrengthClass = 'bg-warning-500';
    } else {
      this.passwordStrengthLabel = 'Strong';
      this.passwordStrengthClass = 'bg-success-500';
    }
  }

  submitSignUp() {
    if (!this.selectedRole) {
      Swal.fire('Role missing', 'Please select a role before continuing.', 'warning');
      return;
    }

    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      const invalidControls = this.getInvalidControls();
      console.warn('Invalid signup controls:', invalidControls);
      Swal.fire('Form invalid', 'Please verify the required fields and correct any errors.', 'error');
      return;
    }

    const payload: any = {
      ...this.signupForm.value,
      role: this.selectedRole,
      acceptedPolicy: this.isChecked,
      profileImageName: this.profileImageName,
    };

    this.usersService.createUser(payload).subscribe({
      next: () => {
        Swal.fire({
          title: 'Success',
          text: 'Account created successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: true,
        }).then(
          () => this.router.navigate(['/signin']));
        this.signupForm.reset();
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to create account.';
        Swal.fire('Error', message, 'error');
      },
    });
  }

  requiresImage(): boolean {
    return this.selectedRole === 'doctor'
      || this.selectedRole === 'nurse'
      || this.selectedRole === 'admin'
      || this.selectedRole === 'auditor'
      || this.selectedRole === 'coordinator';
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.profileImageName = file ? file.name : '';
  }

  onDateOfBirthChange(event: { dateStr: string }): void {
    const value = event?.dateStr ?? '';
    const control = this.signupForm.get('dateOfBirth');
    control?.setValue(value);
    control?.markAsTouched();
    control?.markAsDirty();
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markControlsAsTouched(controlNames: string[]): void {
    controlNames.forEach((controlName) => this.signupForm.get(controlName)?.markAsTouched());
  }

  private getInvalidControls(): string[] {
    return Object.keys(this.signupForm.controls).filter(
      (controlName) => this.signupForm.get(controlName)?.invalid
    );
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.signupForm.get(controlName);
    return !!control && control.invalid && control.dirty;
  }

  getFieldError(controlName: string, label: string): string {
    const control = this.signupForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${label} is required.`;
    if (control.errors['email']) return 'Please enter a valid email address.';
    if (control.errors['minlength']) {
      return `${label} must be at least ${control.errors['minlength'].requiredLength} characters long.`;
    }
    if (control.errors['maxlength']) {
      return `${label} must be at most ${control.errors['maxlength'].requiredLength} characters long.`;
    }
    if (control.errors['pattern'] && controlName === 'phoneNumber') {
      return 'Phone number format is invalid.';
    }
    if (control.errors['pattern']) return `${label} format is invalid.`;

    return `${label} is invalid.`;
  }


ngOnInit(): void {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());// Set minimum date to 120 years ago
  const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());// Set maximum date to 1 year ago
  this.minDateOfBirth = this.formatDateForInput(minDate);
  this.maxDateOfBirth = this.formatDateForInput(maxDate);

  this.signupForm = this.fb.group({
    firstName: ['',[Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
    lastName: ['',[Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
    email: ['',[Validators.required,Validators.email, Validators.minLength(4), Validators.maxLength(50)]],
    password: ['',[Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    phoneNumber: ['',[Validators.required, Validators.pattern('^(\\+216\\s?)?\\d{2}\\s?\\d{3}\\s?\\d{3}$')]],
    sexe: ['',[Validators.required]],
    address: ['',[Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
    dateOfBirth: ['',[Validators.required]],
    primaryDoctor: ['',[Validators.minLength(4), Validators.maxLength(50)]],
    specialization: ['',[Validators.minLength(4), Validators.maxLength(50)]],
    grade: ['',[Validators.minLength(4), Validators.maxLength(50)]],
    diploma: ['',[Validators.minLength(4), Validators.maxLength(50)]],
    yearsOfExperience: [null],
    assignedDepartment: ['',[Validators.minLength(4), Validators.maxLength(50)]],
    auditScope: ['',[Validators.minLength(4), Validators.maxLength(50)]],
  });

}








}
