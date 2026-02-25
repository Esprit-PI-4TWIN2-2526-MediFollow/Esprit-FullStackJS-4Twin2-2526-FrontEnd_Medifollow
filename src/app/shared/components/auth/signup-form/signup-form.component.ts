
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type RoleKey = string;
type CarouselRole = { key: string; label: string; imageKey?: string; isOther?: boolean };
type RoleApiItem = { _id?: string; id?: string; name?: string; label?: string };
type RoleApiResponse = RoleApiItem[] | { data?: RoleApiItem[] };

@Component({
  selector: 'app-signup-form',
  templateUrl: './signup-form.component.html',
  styles: ``,
})
export class SignupFormComponent implements OnInit {
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
  readonly knownRoleImageKeys = ['nurse', 'doctor', 'coordinator', 'auditor', 'patient', 'admin'] as const;

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadRoles();
  }

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
    this.http.post<{ data?: { name?: string } }>('http://localhost:3000/api', { name }).subscribe({
      next: (res: { data?: { name?: string } }) => {
        const createdName = res?.data?.name || name;
        const roleKey = this.generateUniqueRoleKey(createdName);
        const newRole: CarouselRole = {
          key: roleKey,
          label: createdName,
          imageKey: this.resolveImageKey(createdName),
        };
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
    const baseKey = this.normalizeRoleKey(roleName);

    let key = baseKey;
    let counter = 2;
    while (this.roles.some((role) => role.key === key)) {
      key = `${baseKey}-${counter}`;
      counter += 1;
    }

    return key;
  }

  getRoleImageSrc(role: CarouselRole): string {
    const imageKey = role.imageKey || this.resolveImageKey(role.label);
    return `/images/roles/${imageKey}.svg`;
  }

  private loadRoles() {
    this.http.get<RoleApiResponse>('http://localhost:3000/api').subscribe({
      next: (res: RoleApiResponse) => {
        const apiRoles = Array.isArray(res) ? res : (res?.data ?? []);
        const mappedRoles = apiRoles
          .map((item) => {
            const label = this.extractRoleLabel(item);
            if (!label) return null;
            return {
              key: this.generateUniqueRoleKey(label),
              label,
              imageKey: this.resolveImageKey(label),
            } as CarouselRole;
          })
          .filter((role): role is CarouselRole => !!role);

        if (mappedRoles.length > 0) {
          this.roles = mappedRoles;
          this.carouselStart = 0;
          if (this.selectedRole && !this.roles.some((role) => role.key === this.selectedRole)) {
            this.selectedRole = null;
          }
        }
      },
      error: () => {
        // Keep static fallback roles when API is unavailable.
      },
    });
  }

  private extractRoleLabel(role: RoleApiItem): string {
    return (role?.name || role?.label || '').trim();
  }

  private normalizeRoleKey(roleName: string): string {
    return roleName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'role';
  }

  private resolveImageKey(roleName: string): string {
    const normalized = this.normalizeRoleKey(roleName);
    if (this.knownRoleImageKeys.includes(normalized as (typeof this.knownRoleImageKeys)[number])) {
      return normalized;
    }

    if (normalized.includes('doctor')) return 'doctor';
    if (normalized.includes('nurse')) return 'nurse';
    if (normalized.includes('audit')) return 'auditor';
    if (normalized.includes('coord')) return 'coordinator';
    if (normalized.includes('patient')) return 'patient';
    if (normalized.includes('admin')) return 'admin';

    return 'admin';
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