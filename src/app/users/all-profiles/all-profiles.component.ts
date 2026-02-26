import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Users } from '../../models/users';
import { UsersService } from '../../services/users.service';

type RoleKey = string;
type CarouselRole = { key: string; label: string; imageKey?: string; isOther?: boolean };
type RoleApiItem = { _id?: string; id?: string; name?: string; label?: string };
type RoleApiResponse = RoleApiItem[] | { data?: RoleApiItem[] };

@Component({
  selector: 'app-all-profiles',
  templateUrl: './all-profiles.component.html',
  styleUrls: ['./all-profiles.component.css'],
  styles: [`
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
  `],
})
export class AllProfilesComponent implements OnInit {
  users: Users[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 6;
  selectedUserToDelete: Users | null = null;

  isAddUserModalOpen = false;
  signupForm!: FormGroup;
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
  profileImageName = '';
  showAddRoleModal = false;
  newRoleName = '';
  isAddingRole = false;
  addRoleError = '';

  private readonly stepOneControlNames = ['firstName', 'lastName', 'email', 'password', 'phoneNumber', 'sexe', 'address', 'dateOfBirth'];
  readonly knownRoleImageKeys = ['nurse', 'doctor', 'coordinator', 'auditor', 'patient', 'admin'] as const;
  readonly otherRole: CarouselRole = { key: '__other__', label: 'Other Role', isOther: true };

  roles: CarouselRole[] = [
    { key: 'nurse', label: 'Nurse' },
    { key: 'doctor', label: 'Doctor' },
    { key: 'coordinator', label: 'Coordinator' },
    { key: 'auditor', label: 'Auditor' },
    { key: 'patient', label: 'Patient' },
    { key: 'admin', label: 'Admin' },
  ];

  departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Oncology', 'Emergency'];
  doctors = ['Dr. Ahmed Ben Ali', 'Dr. Salma Trabelsi', 'Dr. Youssef Gharbi', 'Dr. Ines Jaziri'];
  auditScopes = ['Logs', 'Data', 'Full Access'];
  sexeOptions = ['Male', 'Female'];

  constructor(
    private usersService: UsersService,
    private fb: FormBuilder,
    private readonly http: HttpClient,
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.initSignupForm();
    this.setDateRange();
    this.loadRoles();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (res: Users[]) => this.users = res,
      error: (err) => console.error(err)
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.itemsPerPage));
  }

  get currentItems(): Users[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  get filteredUsers(): Users[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) return this.users;

    return this.users.filter((user) => {
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = (user.email || '').toLowerCase();
      const emailLocalPart = email.split('@')[0] || '';
      const phone = (user.phoneNumber || '').toLowerCase();
      const role = (user.role || '').toLowerCase();

      return firstName.startsWith(query)
        || lastName.startsWith(query)
        || fullName.includes(query)
        || emailLocalPart.includes(query)
        || phone.includes(query)
        || role.includes(query);
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value || '';
    this.currentPage = 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  handleViewMore(user: Users) {
    this.usersService.getUserById(user._id!).subscribe({
      next: (res: Users) => console.log('User details:', res),
      error: (err) => console.error(err)
    });
  }

  handleEdit(user: Users) {
    console.log('Edit user:', user);
  }

  handleDelete(user: Users) {
    this.selectedUserToDelete = user;
  }

  confirmDelete() {
    if (!this.selectedUserToDelete) return;

    this.usersService.deleteUser(this.selectedUserToDelete._id!).subscribe({
      next: () => {
        this.loadUsers();
        this.selectedUserToDelete = null;
      },
      error: (err) => console.error(err)
    });
  }

  cancelDelete() {
    this.selectedUserToDelete = null;
  }

  getBadgeColor(user: Users): 'success' | 'warning' | 'error' {
    if (user.actif) return 'success';
    return 'error';
  }

  openAddUserModal(): void {
    this.isAddUserModalOpen = true;
    this.resetSignupState();
  }

  closeAddUserModal(): void {
    this.isAddUserModalOpen = false;
    this.showAddRoleModal = false;
  }

  private resetSignupState(): void {
    this.step = 1;
    this.carouselStart = 0;
    this.showPassword = false;
    this.isChecked = false;
    this.showPasswordStrength = false;
    this.passwordStrengthPercent = 0;
    this.passwordStrengthLabel = 'Weak';
    this.passwordStrengthClass = 'bg-error-500';
    this.selectedRole = null;
    this.profileImageName = '';
    this.showAddRoleModal = false;
    this.newRoleName = '';
    this.isAddingRole = false;
    this.addRoleError = '';
    this.signupForm.reset();
  }

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
      next: (res) => {
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
      error: (err) => {
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
      next: (res) => {
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
        // Keep fallback roles.
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
        });
        this.closeAddUserModal();
        this.loadUsers();
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

  isFieldInvalid(controlName: string): boolean {
    const control = this.signupForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
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

  private initSignupForm(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(4), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^(\\+216\\s?)?\\d{2}\\s?\\d{3}\\s?\\d{3}$')]],
      sexe: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
      dateOfBirth: ['', [Validators.required]],
      primaryDoctor: ['', [Validators.minLength(4), Validators.maxLength(50)]],
      specialization: ['', [Validators.minLength(4), Validators.maxLength(50)]],
      grade: ['', [Validators.minLength(4), Validators.maxLength(50)]],
      diploma: ['', [Validators.minLength(4), Validators.maxLength(50)]],
      yearsOfExperience: [null],
      assignedDepartment: ['', [Validators.minLength(4), Validators.maxLength(50)]],
      auditScope: ['', [Validators.minLength(4), Validators.maxLength(50)]],
    });
  }

  private setDateRange(): void {
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    this.minDateOfBirth = this.formatDateForInput(minDate);
    this.maxDateOfBirth = this.formatDateForInput(maxDate);
  }
}
