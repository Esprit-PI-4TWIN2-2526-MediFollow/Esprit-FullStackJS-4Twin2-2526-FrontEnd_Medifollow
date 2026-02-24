
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type RoleKey = string;
type CarouselRole = { key: string; label: string; isOther?: boolean };

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styles: ``,
})
export class SignupFormComponent {
  showAddRoleModal = false;
  newRoleName = '';
  isAddingRole = false;
  addRoleError = '';
  step = 1;
  carouselStart = 0;
  readonly visibleRoles = 5;

  showPassword = false;
  isChecked = false;
  selectedRole: RoleKey | null = null;

  roles: CarouselRole[] = [
    { key: 'nurse', label: 'Nurse' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'coordinator', label: 'Coordinator' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'patient', label: 'Patient' },
    { key: 'admin', label: 'Admin' },
  ];
  readonly otherRole: CarouselRole = { key: '__other__', label: 'Other Role', isOther: true };

  constructor(private readonly http: HttpClient) {}

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

  get carouselRoles() {
    return [...this.roles, this.otherRole];
  }

  get displayedRoles() {
    return this.carouselRoles.slice(this.carouselStart, this.carouselStart + this.visibleRoles);
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
    if (this.carouselStart + this.visibleRoles < this.carouselRoles.length) this.carouselStart += 1;
  }

  isOtherRole(role: CarouselRole) {
    return !!role.isOther;
  }

  selectRole(role: RoleKey) {
    this.selectedRole = role;
  }

  selectRoleFromCarousel(role: CarouselRole) {
    if (role.isOther) {
      this.openAddRoleModal();
      return;
    }
    this.selectRole(role.key);
  }

  openAddRoleModal() {
    this.showAddRoleModal = true;
    this.newRoleName = '';
    this.addRoleError = '';
  }

  closeAddRoleModal() {
    this.showAddRoleModal = false;
    this.newRoleName = '';
    this.isAddingRole = false;
    this.addRoleError = '';
  }

  submitAddRole() {
    const name = this.newRoleName.trim();
    this.addRoleError = '';

    if (!name) {
      this.addRoleError = 'Le nom du role est obligatoire.';
      return;
    }

    const alreadyExists = this.roles.some((role) => role.label.toLowerCase() === name.toLowerCase());
    if (alreadyExists) {
      this.addRoleError = 'Ce role existe deja.';
      return;
    }

    this.isAddingRole = true;
    this.http.post<{ data?: { name?: string } }>('http://localhost:3000/api/roles', { name }).subscribe({
      next: (res: { data?: { name?: string } }) => {
        const createdName = res?.data?.name || name;
        const roleKey = this.generateUniqueRoleKey(createdName);
        const newRole: CarouselRole = { key: roleKey, label: createdName };
        this.roles.push(newRole);
        this.selectedRole = newRole.key;
        this.isAddingRole = false;
        this.showAddRoleModal = false;
      },
      error: (err: { error?: { message?: string } }) => {
        this.isAddingRole = false;
        this.addRoleError = err?.error?.message || 'Erreur lors de la creation du role.';
      },
    });
  }

  private generateUniqueRoleKey(roleName: string): string {
    const baseKey = roleName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'role';

    let key = baseKey;
    let counter = 2;
    while (this.roles.some((role) => role.key === key)) {
      key = `${baseKey}-${counter}`;
      counter += 1;
    }

    return key;
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
