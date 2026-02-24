
import { Component } from '@angular/core';

type RoleKey = 'patient' | 'doctor' | 'nurse' | 'coordinator' | 'auditor' | 'admin';

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styles: ``,
})
export class SignupFormComponent {
  step = 1;
  carouselStart = 0;
  readonly visibleRoles = 5;

  showPassword = false;
  isChecked = false;
  selectedRole: RoleKey | null = null;

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

  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
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

  get displayedRoles() {
    return this.roles.slice(this.carouselStart, this.carouselStart + this.visibleRoles);
  }

  get roleTitle(): string {
    const role = this.roles.find((r) => r.key === this.selectedRole);
    return role ? role.label : 'Role';
  }

  roleInitial(label: string): string {
    return label.charAt(0).toUpperCase();
  }

  prevRoles() {
    if (this.carouselStart > 0) this.carouselStart -= 1;
  }

  nextRoles() {
    if (this.carouselStart + this.visibleRoles < this.roles.length) this.carouselStart += 1;
  }

  selectRole(role: RoleKey) {
    this.selectedRole = role;
  }

  continueToStepTwo() {
    if (!this.selectedRole) return;
    this.step = 2;
  }

  backToRoleSelection() {
    this.step = 1;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  submitSignUp() {
    console.log('Role:', this.selectedRole);
    console.log('Form:', this.form);
    console.log('Accepted policy:', this.isChecked);
    console.log('Profile image:', this.profileImageName);
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
}
