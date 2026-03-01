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
    :host ::ng-deep .flatpickr-calendar.flatpickr-theme-green { border: 1px solid #10b981; box-shadow: 0 10px 30px rgba(16,185,129,.2); }
    :host ::ng-deep .flatpickr-theme-green .flatpickr-months .flatpickr-month,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-weekdays { background: #ecfdf5; }
    :host ::ng-deep .flatpickr-theme-green .flatpickr-current-month .flatpickr-monthDropdown-months,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-current-month input.cur-year,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-weekday { color: #065f46; font-weight: 600; }
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.selected,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.startRange,
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.endRange { background: #10b981; border-color: #10b981; color: #fff; }
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day:hover { background: #d1fae5; border-color: #a7f3d0; color: #065f46; }
    :host ::ng-deep .flatpickr-theme-green .flatpickr-day.today { border-color: #10b981; color: #047857; }
  `],
})
export class AllProfilesComponent implements OnInit {

  // ── Data ──────────────────────────────────────────────────────
  users: Users[] = [];
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 6;

  // ── Expand/Collapse ───────────────────────────────────────────
  expandedIds = new Set<string>();

  // ── Inline Edit ───────────────────────────────────────────────
  editingInlineId: string | null = null;
  inlineForm!: FormGroup;
  isSavingInline = false;
  inlineAvatarFile: File | null = null;
  inlineAvatarName = '';

  // ── Delete ────────────────────────────────────────────────────
  selectedUserToDelete: Users | null = null;
selectedRoleFilter = '';

  // ── View modal stub (kept for template compatibility) ─────────
  viewedUser: Users | null = null;
  isViewUserModalOpen = false;
  closeViewUserModal(): void { this.isViewUserModalOpen = false; this.viewedUser = null; }
  handleViewMore(user: Users): void { this.viewedUser = user; this.isViewUserModalOpen = true; }

  // ── Add User Modal ────────────────────────────────────────────
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
  selectedAvatarFile: File | null = null;
  showAddRoleModal = false;
  newRoleName = '';
  isAddingRole = false;
  addRoleError = '';

  private readonly stepOneControlNames = [
    'firstName','lastName','email','password','phoneNumber','sexe','address','dateOfBirth',
  ];
  readonly knownRoleImageKeys = ['nurse','doctor','coordinator','auditor','patient','admin'] as const;
  readonly otherRole: CarouselRole = { key: '__other__', label: 'Other Role', isOther: true };

  roles: CarouselRole[] = [
    { key: 'nurse',       label: 'Nurse' },
    { key: 'doctor',      label: 'Doctor' },
    { key: 'coordinator', label: 'Coordinator' },
    { key: 'auditor',     label: 'Auditor' },
    { key: 'patient',     label: 'Patient' },
    { key: 'admin',       label: 'Admin' },
  ];

  departments  = ['Cardiology','Neurology','Pediatrics','Oncology','Emergency'];
  doctors      = ['Dr. Ahmed Ben Ali','Dr. Salma Trabelsi','Dr. Youssef Gharbi','Dr. Ines Jaziri'];
  auditScopes  = ['Logs','Data','Full Access'];
  sexeOptions  = ['Male','Female'];
  countryOptions = [
    { name: 'Tunisia',              iso2: 'tn', dialCode: '+216' },
    { name: 'Algeria',              iso2: 'dz', dialCode: '+213' },
    { name: 'Morocco',              iso2: 'ma', dialCode: '+212' },
    { name: 'Libya',                iso2: 'ly', dialCode: '+218' },
    { name: 'Egypt',                iso2: 'eg', dialCode: '+20'  },
    { name: 'France',               iso2: 'fr', dialCode: '+33'  },
    { name: 'Spain',                iso2: 'es', dialCode: '+34'  },
    { name: 'Italy',                iso2: 'it', dialCode: '+39'  },
    { name: 'Belgium',              iso2: 'be', dialCode: '+32'  },
    { name: 'Switzerland',          iso2: 'ch', dialCode: '+41'  },
    { name: 'United States',        iso2: 'us', dialCode: '+1'   },
    { name: 'Canada',               iso2: 'ca', dialCode: '+1'   },
    { name: 'Germany',              iso2: 'de', dialCode: '+49'  },
    { name: 'United Kingdom',       iso2: 'gb', dialCode: '+44'  },
    { name: 'Turkey',               iso2: 'tr', dialCode: '+90'  },
    { name: 'Saudi Arabia',         iso2: 'sa', dialCode: '+966' },
    { name: 'United Arab Emirates', iso2: 'ae', dialCode: '+971' },
    { name: 'Qatar',                iso2: 'qa', dialCode: '+974' },
  ];
  selectedDialCode = '+216';

  // ── Available roles for inline role select ────────────────────
  get availableRoleOptions(): string[] {
    return this.roles
      .filter(r => !r.isOther)
      .map(r => r.label);
  }

  constructor(
    private usersService: UsersService,
    private fb: FormBuilder,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.initSignupForm();
    this.setDateRange();
    this.loadRoles();
  }

  // ── Load / Pagination ─────────────────────────────────────────
  loadUsers(): void {
    this.usersService.getUsers().subscribe({
      next: (res: Users[]) => (this.users = res),
      error: (err) => console.error(err),
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
  const q = this.searchTerm.trim().toLowerCase();
  return this.users.filter((u) => {
    // Filtre par rôle
    if (this.selectedRoleFilter) {
      const roleLabel = this.selectedRoleFilter.toLowerCase();
      if (!(u.role || '').toLowerCase().includes(roleLabel)) return false;
    }
    // Filtre par recherche texte
    if (!q) return true;
    const fn = (u.firstName  || '').toLowerCase();
    const ln = (u.lastName   || '').toLowerCase();
    const em = (u.email      || '').toLowerCase().split('@')[0];
    const ph = (u.phoneNumber|| '').toLowerCase();
    const ro = (u.role       || '').toLowerCase();
    return fn.startsWith(q) || ln.startsWith(q) || `${fn} ${ln}`.includes(q)
        || em.includes(q)   || ph.includes(q)   || ro.includes(q);
  });
}

  onSearchInput(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value || '';
    this.currentPage = 1;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  // ── Expand / Collapse ─────────────────────────────────────────
  toggleExpand(user: Users): void {
    const id = user._id!;
    if (this.editingInlineId === id) this.cancelInlineEdit();
    this.expandedIds.has(id) ? this.expandedIds.delete(id) : this.expandedIds.add(id);
  }

  isExpanded(user: Users): boolean {
    return this.expandedIds.has(user._id!);
  }

  // ── Inline Edit ───────────────────────────────────────────────
  startInlineEdit(user: Users): void {
    this.cancelInlineEdit();
    this.expandedIds.delete(user._id!);

    const dob = user.dateOfBirth
      ? this.formatDateForInput(new Date(user.dateOfBirth))
      : '';

    this.inlineForm = this.fb.group({
      firstName:          [user.firstName          || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName:           [user.lastName           || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email:              [user.email              || '', [Validators.required, Validators.email]],
      phoneNumber:        [user.phoneNumber        || '', [Validators.required]],
      sexe:               [user.sexe               || ''],
      dateOfBirth:        [dob],
      address:            [user.address            || ''],
      actif:              [user.actif ?? true],
      // FIX: role is now editable in inline form
      role:               [user.role               || ''],
      // role-specific
      primaryDoctor:      [user.primaryDoctor      || ''],
      specialization:     [user.specialization     || ''],
      grade:              [user.grade              || ''],
      diploma:            [user.diploma            || ''],
      yearsOfExperience:  [user.yearsOfExperience  ?? null],
      assignedDepartment: [user.assignedDepartment || ''],
      auditScope:         [user.auditScope         || ''],
    });

    this.editingInlineId  = user._id!;
    this.inlineAvatarFile = null;
    this.inlineAvatarName = '';
  }

  cancelInlineEdit(): void {
    this.editingInlineId  = null;
    this.inlineAvatarFile = null;
    this.inlineAvatarName = '';
  }

  saveInlineEdit(user: Users): void {
    if (!this.inlineForm || this.inlineForm.invalid) {
      this.inlineForm?.markAllAsTouched();
      return;
    }
    this.isSavingInline = true;
    // FIX: use the role from the form (editable) instead of user.role
    const payload = { ...this.inlineForm.value };

    this.usersService.updateUser(user._id!, payload, this.inlineAvatarFile || undefined).subscribe({
      next: () => {
        this.isSavingInline   = false;
        this.editingInlineId  = null;
        this.inlineAvatarFile = null;
        this.inlineAvatarName = '';
        this.loadUsers();
        Swal.fire({ title: 'Updated', text: 'User updated successfully.', icon: 'success', timer: 1800, showConfirmButton: false });
      },
      error: (err) => {
        this.isSavingInline = false;
        Swal.fire('Error', err?.error?.message || 'Failed to update user.', 'error');
      },
    });
  }

  // FIX: proper file handling for inline avatar
  onInlineImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.inlineAvatarFile = file;
    this.inlineAvatarName = file ? file.name : '';
  }

  // ── Delete ────────────────────────────────────────────────────
  handleDelete(user: Users): void { this.selectedUserToDelete = user; }

  confirmDelete(): void {
    if (!this.selectedUserToDelete) return;
    this.usersService.deleteUser(this.selectedUserToDelete._id!).subscribe({
      next: () => { this.loadUsers(); this.selectedUserToDelete = null; },
      error: (err) => console.error(err),
    });
  }

  cancelDelete(): void { this.selectedUserToDelete = null; }

  getBadgeColor(user: Users): 'success' | 'error' {
    return user.actif ? 'success' : 'error';
  }

  // ── Add User Modal ────────────────────────────────────────────
  openAddUserModal(): void { this.isAddUserModalOpen = true; this.resetSignupState(); }
  closeAddUserModal(): void { this.isAddUserModalOpen = false; this.showAddRoleModal = false; }

  private resetSignupState(): void {
    this.step = 1; this.carouselStart = 0; this.showPassword = false; this.isChecked = false;
    this.showPasswordStrength = false; this.passwordStrengthPercent = 0;
    this.passwordStrengthLabel = 'Weak'; this.passwordStrengthClass = 'bg-error-500';
    this.selectedRole = null; this.profileImageName = ''; this.selectedAvatarFile = null;
    this.showAddRoleModal = false; this.newRoleName = ''; this.isAddingRole = false; this.addRoleError = '';
    this.signupForm.reset();
    this.selectedDialCode = '+216'; this.applyDialCodeToPhone(); this.setPasswordValidatorsForMode();
  }

  submitSignUp(): void {
    if (!this.selectedRole) { Swal.fire('Role missing', 'Please select a role.', 'warning'); return; }
    this.applyRoleSpecificValidators();
    if (this.signupForm.invalid) { this.signupForm.markAllAsTouched(); Swal.fire('Form invalid', 'Please verify required fields.', 'error'); return; }
    const payload: any = { ...this.signupForm.value, role: this.selectedRole, acceptedPolicy: this.isChecked };
    this.usersService.createUser(payload, this.selectedAvatarFile || undefined).subscribe({
      next: () => { Swal.fire({ title: 'Success', text: 'Account created.', icon: 'success', timer: 2000, showConfirmButton: true }); this.closeAddUserModal(); this.loadUsers(); },
      error: (err) => Swal.fire('Error', err?.error?.message || 'Failed to create account.', 'error'),
    });
  }

  // ── Carousel ──────────────────────────────────────────────────
  get carouselRoles(): CarouselRole[] { return [...this.roles, this.otherRole]; }
  get displayedRoles(): CarouselRole[] { return this.carouselRoles.slice(this.carouselStart, this.carouselStart + this.visibleRoles); }
  get roleTitle(): string { return this.roles.find((r) => r.key === this.selectedRole)?.label ?? 'Role'; }

  prevRoles(): void { if (this.carouselStart > 0) this.carouselStart--; }
  nextRoles(): void { if (this.carouselStart + this.visibleRoles < this.carouselRoles.length) this.carouselStart++; }
  isOtherRole(role: CarouselRole): boolean { return !!role.isOther; }

  selectRole(role: RoleKey): void { this.selectedRole = role; this.applyRoleSpecificValidators(); }
  selectRoleFromCarousel(role: CarouselRole): void {
    if (role.isOther) { this.openAddRoleModal(); return; }
    this.selectRole(role.key);
  }

  openAddRoleModal(): void { this.showAddRoleModal = true; this.newRoleName = ''; this.addRoleError = ''; }
  closeAddRoleModal(): void { this.showAddRoleModal = false; this.newRoleName = ''; this.isAddingRole = false; this.addRoleError = ''; }

  submitAddRole(): void {
    const name = this.newRoleName.trim();
    this.addRoleError = '';
    if (!name) { this.addRoleError = 'Role name is required.'; return; }
    if (this.roles.some((r) => r.label.toLowerCase() === name.toLowerCase())) { this.addRoleError = 'Role already exists.'; return; }
    this.isAddingRole = true;
    this.http.post<{ data?: { name?: string } }>('http://localhost:3000/api', { name }).subscribe({
      next: (res) => {
        const label = res?.data?.name || name;
        const newRole: CarouselRole = { key: this.generateUniqueRoleKey(label), label, imageKey: this.resolveImageKey(label) };
        this.roles.push(newRole); this.selectedRole = newRole.key;
        this.isAddingRole = false; this.showAddRoleModal = false;
      },
      error: (err) => { this.isAddingRole = false; this.addRoleError = err?.error?.message || 'Error creating role.'; },
    });
  }

  private loadRoles(): void {
    this.http.get<RoleApiResponse>('http://localhost:3000/api').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        const mapped = list
          .map((item) => { const label = (item?.name || item?.label || '').trim(); return label ? { key: this.generateUniqueRoleKey(label), label, imageKey: this.resolveImageKey(label) } as CarouselRole : null; })
          .filter((r): r is CarouselRole => !!r);
        if (mapped.length > 0) { this.roles = mapped; this.carouselStart = 0; }
      },
      error: () => {},
    });
  }

  getRoleImageSrc(role: CarouselRole): string {
    return `/images/roles/${role.imageKey || this.resolveImageKey(role.label)}.svg`;
  }

  private generateUniqueRoleKey(name: string): string {
    const base = this.normalizeRoleKey(name); let key = base; let c = 2;
    while (this.roles.some((r) => r.key === key)) { key = `${base}-${c}`; c++; }
    return key;
  }

  private normalizeRoleKey(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'role';
  }

  private resolveImageKey(name: string): string {
    const n = this.normalizeRoleKey(name);
    if (this.knownRoleImageKeys.includes(n as any)) return n;
    if (n.includes('doctor'))  return 'doctor';
    if (n.includes('nurse'))   return 'nurse';
    if (n.includes('audit'))   return 'auditor';
    if (n.includes('coord'))   return 'coordinator';
    if (n.includes('patient')) return 'patient';
    return 'admin';
  }

  // ── Step logic ────────────────────────────────────────────────
  continueToStepTwo(): void {
    if (!this.selectedRole) return;
    this.applyRoleSpecificValidators();
    this.markControlsAsTouched(this.stepOneControlNames);
    if (this.stepOneControlNames.some((c) => this.signupForm.get(c)?.invalid)) {
      Swal.fire('Form invalid', 'Please complete valid common information.', 'error'); return;
    }
    this.step = 2;
  }

  backToRoleSelection(): void { this.step = 1; }

  // ── Password ──────────────────────────────────────────────────
  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  generateRandomPassword(min = 6): void {
    const len = Math.max(min, 10);
    const lc = 'abcdefghijklmnopqrstuvwxyz', uc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', nb = '0123456789', sy = '!@#$%^&*';
    const all = lc + uc + nb + sy;
    const req = [lc,uc,nb,sy].map((s) => s[Math.floor(Math.random() * s.length)]);
    const rnd = Array.from({ length: len - req.length }, () => all[Math.floor(Math.random() * all.length)]);
    const pwd = [...req, ...rnd].sort(() => Math.random() - .5).join('');
    const ctrl = this.signupForm.get('password')!;
    ctrl.setValue(pwd); ctrl.markAsDirty(); ctrl.markAsTouched();
    this.showPasswordStrength = false; this.showPassword = true;
  }

  onPasswordManualInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value || '';
    this.showPasswordStrength = true;
    let s = 0;
    if (val.length >= 6) s += 25; if (val.length >= 10) s += 15;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) s += 20;
    if (/\d/.test(val)) s += 20; if (/[^A-Za-z0-9]/.test(val)) s += 20;
    this.passwordStrengthPercent = Math.min(s, 100);
    if (s < 40)  { this.passwordStrengthLabel = 'Weak';   this.passwordStrengthClass = 'bg-error-500'; }
    else if (s < 70) { this.passwordStrengthLabel = 'Medium'; this.passwordStrengthClass = 'bg-warning-500'; }
    else         { this.passwordStrengthLabel = 'Strong'; this.passwordStrengthClass = 'bg-success-500'; }
  }

  // ── Phone ─────────────────────────────────────────────────────
  onCountryCodeChange(event: Event): void {
    this.selectedDialCode = (event.target as HTMLSelectElement).value || '+216';
    this.applyDialCodeToPhone();
  }

  onPhoneNumberFocus(): void {
    if (!String(this.signupForm.get('phoneNumber')?.value || '').trim()) this.applyDialCodeToPhone();
  }

  get selectedCountry() { return this.countryOptions.find((c) => c.dialCode === this.selectedDialCode) || this.countryOptions[0]; }
  getFlagUrl(iso2: string): string { return `https://flagcdn.com/w40/${iso2}.png`; }

  private applyDialCodeToPhone(): void {
    const ctrl = this.signupForm.get('phoneNumber'); if (!ctrl) return;
    const local = String(ctrl.value || '').replace(/^\+\d{1,4}\s*/, '').trim();
    ctrl.setValue(local ? `${this.selectedDialCode} ${local}` : `${this.selectedDialCode} `);
  }

  // ── Date ──────────────────────────────────────────────────────
  onDateOfBirthChange(event: { dateStr: string }): void {
    const ctrl = this.signupForm.get('dateOfBirth');
    ctrl?.setValue(event?.dateStr ?? ''); ctrl?.markAsTouched(); ctrl?.markAsDirty();
  }

  private formatDateForInput(d: Date): string {
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  // ── Images ────────────────────────────────────────────────────
  // FIX: proper file assignment for create modal
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedAvatarFile = file;
    this.profileImageName = file ? file.name : '';
  }

  requiresImage(): boolean {
    return ['doctor','nurse','admin','auditor','coordinator'].some((r) => this.isSelectedRole(r as any));
  }

  // ── Role helpers ──────────────────────────────────────────────
  isSelectedRole(rt: 'doctor'|'patient'|'nurse'|'coordinator'|'auditor'|'admin'): boolean {
    const t = `${this.selectedRole || ''} ${this.roleTitle || ''}`.toLowerCase();
    return this.roleAliases(rt).some((a) => t.includes(a));
  }

  isRoleType(rv: unknown, rt: 'doctor'|'patient'|'nurse'|'coordinator'|'auditor'|'admin'): boolean {
    return this.roleAliases(rt).some((a) => String(rv || '').toLowerCase().includes(a));
  }

  // Helper used in template to check inline form's current role value
  isInlineRoleType(rt: 'doctor'|'patient'|'nurse'|'coordinator'|'auditor'|'admin'): boolean {
    const currentRole = this.inlineForm?.get('role')?.value || '';
    return this.roleAliases(rt).some((a) => String(currentRole).toLowerCase().includes(a));
  }

  private roleAliases(rt: string): string[] {
    const m: Record<string, string[]> = {
      doctor:      ['doctor','medecin','médecin','physician'],
      patient:     ['patient'],
      nurse:       ['nurse','infirmier','infirmiere','infirmière'],
      coordinator: ['coordinator','coordinateur','coordinatrice'],
      auditor:     ['auditor','audit','auditeur'],
      admin:       ['admin','administrator','administrateur'],
    };
    return m[rt] ?? [];
  }

  // ── Form helpers ──────────────────────────────────────────────
  isFieldInvalid(name: string): boolean {
    const c = this.signupForm.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  getFieldError(name: string, label: string): string {
    const e = this.signupForm.get(name)?.errors;
    if (!e) return '';
    if (e['required'])  return `${label} is required.`;
    if (e['email'])     return 'Please enter a valid email address.';
    if (e['minlength']) return `${label} must be at least ${e['minlength'].requiredLength} characters.`;
    if (e['maxlength']) return `${label} must be at most ${e['maxlength'].requiredLength} characters.`;
    if (e['min'] && name === 'yearsOfExperience') return 'Must be at least 0.';
    if (e['max'] && name === 'yearsOfExperience') return 'Value is too high.';
    if (e['pattern']  && name === 'phoneNumber')  return 'Phone number format is invalid.';
    return `${label} is invalid.`;
  }

  private markControlsAsTouched(names: string[]): void {
    names.forEach((n) => this.signupForm.get(n)?.markAsTouched());
  }

  private applyRoleSpecificValidators(): void {
    const rc = ['primaryDoctor','specialization','grade','diploma','yearsOfExperience','assignedDepartment','auditScope'];
    rc.forEach((n) => { this.signupForm.get(n)?.setValidators([]); this.signupForm.get(n)?.updateValueAndValidity({ emitEvent: false }); });
    if (this.isSelectedRole('patient'))    this.signupForm.get('primaryDoctor')?.setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(50)]);
    if (this.isSelectedRole('doctor')) {
      ['specialization','grade','diploma'].forEach((f) => this.signupForm.get(f)?.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]));
      this.signupForm.get('yearsOfExperience')?.setValidators([Validators.required, Validators.min(0), Validators.max(80)]);
      this.signupForm.get('assignedDepartment')?.setValidators([Validators.required]);
    }
    if (this.isSelectedRole('nurse') || this.isSelectedRole('coordinator')) this.signupForm.get('assignedDepartment')?.setValidators([Validators.required]);
    if (this.isSelectedRole('auditor')) this.signupForm.get('auditScope')?.setValidators([Validators.required]);
    rc.forEach((n) => this.signupForm.get(n)?.updateValueAndValidity({ emitEvent: false }));
  }

  private setPasswordValidatorsForMode(): void {
    const ctrl = this.signupForm.get('password'); if (!ctrl) return;
    ctrl.setValidators([Validators.required, Validators.minLength(6), Validators.maxLength(100)]);
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private initSignupForm(): void {
    this.signupForm = this.fb.group({
      firstName:          ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      lastName:           ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
      email:              ['', [Validators.required, Validators.email, Validators.minLength(4), Validators.maxLength(50)]],
      password:           ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      phoneNumber:        [`${this.selectedDialCode} `, [Validators.required, Validators.pattern('^\\+\\d{1,4}\\s[0-9 ]{6,15}$')]],
      sexe:               ['', [Validators.required]],
      address:            ['', [Validators.required, Validators.minLength(4), Validators.maxLength(120)]],
      dateOfBirth:        ['', [Validators.required]],
      primaryDoctor:      [''],
      specialization:     [''],
      grade:              [''],
      diploma:            [''],
      yearsOfExperience:  [null],
      assignedDepartment: [''],
      auditScope:         [''],
    });
    this.applyRoleSpecificValidators();
  }

  private setDateRange(): void {
    const today = new Date();
    this.minDateOfBirth = this.formatDateForInput(new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()));
    this.maxDateOfBirth = this.formatDateForInput(new Date(today.getFullYear() - 1,   today.getMonth(), today.getDate()));
  }

  get uniqueRoles(): string[] {
  const roles = this.users
    .map(u => u.role || '')
    .filter(r => r.trim() !== '');
  return [...new Set(roles)].sort();
}
}
