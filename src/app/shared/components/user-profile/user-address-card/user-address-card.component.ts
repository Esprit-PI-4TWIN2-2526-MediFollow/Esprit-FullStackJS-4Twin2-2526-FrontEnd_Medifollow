import { Component, OnInit } from '@angular/core';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/user/users.service';

@Component({
  selector: 'app-user-address-card',
  templateUrl: './user-address-card.component.html',
  styles: ``
})
export class UserAddressCardComponent implements OnInit {

  constructor(private usersService: UsersService) { }

  isOpen = false;
  currentUser: Users | null = null;
  isLoading = true;
  isSaving = false;
  saveError = '';
  selectedAvatarFile: File | null = null;
  avatarFileName = '';
  avatarPreviewUrl = '';

// ── Propriétés à ajouter ────────────────────────────────
minDateOfBirth = '';
maxDateOfBirth = '';
dateOfBirthError = '';

  editForm = {
    address: '',
    sexe: '',
    dateOfBirth: '',
    primaryDoctor: '',
    specialization: '',
    grade: '',
    diploma: '',
    yearsOfExperience: '',
    assignedDepartment: '',
    auditScope: '',
  };

  ngOnInit() {
    this.loadCurrentUser();
this.setDateRange();
  this.loadCurrentUser();
  }

  loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      this.isLoading = false;
      return;
    }

    try {
      const localUser = JSON.parse(userStr);
      const userEmail = localUser.email;
      if (!userEmail) {
        this.isLoading = false;
        return;
      }

      this.usersService.getUserByEmail(userEmail).subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching user:', err);
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.isLoading = false;
    }
  }

setDateRange(): void {
  const today = new Date();

  // Min : 120 ans en arrière
  const min = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate()
  );
  this.minDateOfBirth = this.formatDateForInput(min);

  // Max : il y a 18 ans (né avant 2008 si on est en 2026)
  const max = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );
  this.maxDateOfBirth = this.formatDateForInput(max);
}

onDateOfBirthChange(value: string): void {
  this.updateEditField('dateOfBirth', value);
  this.dateOfBirthError = '';

  if (!value) {
    this.dateOfBirthError = 'Date of birth is required.';
    return;
  }

  const selected = new Date(value);
  const today    = new Date();

  if (isNaN(selected.getTime())) {
    this.dateOfBirthError = 'Please enter a valid date.';
    return;
  }

  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - 18,  today.getMonth(), today.getDate());

  if (selected > maxDate) {
    this.dateOfBirthError = 'Patient must be at least 18 years old.';
    return;
  }

  if (selected < minDate) {
    this.dateOfBirthError = 'Please enter a valid date of birth.';
    return;
  }
}

  openModal() {
    this.fillEditForm();
    this.saveError = '';
    this.clearAvatarSelection();
    this.isOpen = true;
  }

  closeModal() {
    this.clearAvatarSelection();
    this.isOpen = false;
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.clearAvatarSelection();
    this.selectedAvatarFile = file;
    this.avatarFileName = file ? file.name : '';
    this.avatarPreviewUrl = file ? URL.createObjectURL(file) : '';
  }

  updateEditField(
    field: keyof typeof this.editForm,
    value: string | number | null
  ) {
    this.editForm[field] = value == null ? '' : String(value);
  }

  get displayItems(): Array<{ label: string; value: string }> {
    const items: Array<{ label: string; value: string }> = [
      { label: 'Address', value: this.currentUser?.address || '-' },
      { label: 'Sexe', value: this.currentUser?.sexe || '-' },
      {
        label: 'Date of Birth',
        value: this.currentUser?.dateOfBirth
          ? new Date(this.currentUser.dateOfBirth).toLocaleDateString()
          : '-',
      },
    ];

    if (this.isRoleType('patient')) {
      items.push({ label: 'Primary Doctor', value: this.currentUser?.primaryDoctor || '-' });
    }

    if (this.isRoleType('doctor')) {
      items.push(
        { label: 'Specialization', value: this.currentUser?.specialization || '-' },
        { label: 'Grade', value: this.currentUser?.grade || '-' },
        { label: 'Diploma', value: this.currentUser?.diploma || '-' },
        {
          label: 'Years of Experience',
          value: this.currentUser?.yearsOfExperience != null ? String(this.currentUser.yearsOfExperience) : '-',
        },
        { label: 'Assigned Department', value: this.currentUser?.assignedDepartment || '-' }
      );
    }

    if (this.isRoleType('nurse') || this.isRoleType('coordinator')) {
      items.push({ label: 'Assigned Department', value: this.currentUser?.assignedDepartment || '-' });
    }

    if (this.isRoleType('auditor')) {
      items.push({ label: 'Audit Scope', value: this.currentUser?.auditScope || '-' });
    }

    return items;
  }

  get roleLabel(): string {
    return this.currentUser?.role ? String(this.currentUser.role) : 'User';
  }

  isRole(roleType: 'doctor' | 'patient' | 'nurse' | 'coordinator' | 'auditor' | 'admin'): boolean {
    return this.isRoleType(roleType);
  }

  handleSave() {
    if (!this.currentUser?._id || this.isSaving) return;

    this.isSaving = true;
    this.saveError = '';

    const payload: Partial<Users> = {
      address: String(this.editForm.address || '').trim(),
      sexe: String(this.editForm.sexe || '').trim(),
      dateOfBirth: this.editForm.dateOfBirth ? new Date(String(this.editForm.dateOfBirth)) : undefined,
      primaryDoctor: String(this.editForm.primaryDoctor || '').trim(),
      specialization: String(this.editForm.specialization || '').trim(),
      grade: String(this.editForm.grade || '').trim(),
      diploma: String(this.editForm.diploma || '').trim(),
      yearsOfExperience: this.editForm.yearsOfExperience === '' ? undefined : Number(this.editForm.yearsOfExperience),
      assignedDepartment: String(this.editForm.assignedDepartment || '').trim(),
      auditScope: String(this.editForm.auditScope || '').trim(),
    };

    this.usersService.updateUser(this.currentUser._id, payload, this.selectedAvatarFile || undefined).subscribe({
      next: (response: any) => {
        const updatedUser = (response?.user ?? response) as Partial<Users>;
        this.currentUser = { ...this.currentUser, ...payload, ...updatedUser } as Users;
        this.clearAvatarSelection();
        this.isSaving = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.saveError = err?.error?.message || 'Failed to update additional information.';
        this.isSaving = false;
      }
    });
  }

  private fillEditForm() {
    this.editForm.address = this.currentUser?.address || '';
    this.editForm.sexe = this.currentUser?.sexe || '';
    this.editForm.dateOfBirth = this.formatDateForInput(this.currentUser?.dateOfBirth);
    this.editForm.primaryDoctor = this.currentUser?.primaryDoctor || '';
    this.editForm.specialization = this.currentUser?.specialization || '';
    this.editForm.grade = this.currentUser?.grade || '';
    this.editForm.diploma = this.currentUser?.diploma || '';
    this.editForm.yearsOfExperience =
      this.currentUser?.yearsOfExperience != null ? String(this.currentUser.yearsOfExperience) : '';
    this.editForm.assignedDepartment = this.currentUser?.assignedDepartment || '';
    this.editForm.auditScope = this.currentUser?.auditScope || '';
  }

  private formatDateForInput(value: Date | string | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isRoleType(roleType: 'doctor' | 'patient' | 'nurse' | 'coordinator' | 'auditor' | 'admin'): boolean {
    const role = String(this.currentUser?.role || '').toLowerCase();
    return this.roleAliases(roleType).some((alias) => role.includes(alias));
  }

  private roleAliases(roleType: string): string[] {
    const aliases: Record<string, string[]> = {
      doctor: ['doctor', 'medecin', 'physician'],
      patient: ['patient'],
      nurse: ['nurse', 'infirmier', 'infirmiere'],
      coordinator: ['coordinator', 'coordinateur', 'coordinatrice'],
      auditor: ['auditor', 'audit', 'auditeur'],
      admin: ['admin', 'administrator', 'administrateur'],
    };

    return aliases[roleType] ?? [];
  }

  private clearAvatarSelection() {
    if (this.avatarPreviewUrl) {
      URL.revokeObjectURL(this.avatarPreviewUrl);
    }
    this.selectedAvatarFile = null;
    this.avatarFileName = '';
    this.avatarPreviewUrl = '';
  }
}
