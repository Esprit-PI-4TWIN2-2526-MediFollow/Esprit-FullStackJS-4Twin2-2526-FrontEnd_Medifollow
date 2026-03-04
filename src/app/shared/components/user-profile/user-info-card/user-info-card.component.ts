import { Component, OnInit } from '@angular/core';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/user/users.service';

@Component({
  selector: 'app-user-info-card',
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent implements OnInit {

  constructor(
    private usersService: UsersService
  ) { }

  isOpen = false;
  currentUser: Users | null = null;
  isLoading = true;
  isSaving = false;
  saveError = '';
  showPassword = false;

  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    password: '',
  };

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    // Get user email from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        const userEmail = localUser.email;

        // Fetch fresh data from API
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
    } else {
      this.isLoading = false;
    }
  }

  closeModal() { this.isOpen = false; }

  handleSave() {
    if (!this.currentUser?._id || this.isSaving) return;

    const password = this.editForm.password.trim();
    if (password && password.length < 6) {
      this.saveError = 'Password must be at least 6 characters.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const payload: Partial<Users> = {
      firstName: this.editForm.firstName.trim(),
      lastName: this.editForm.lastName.trim(),
      email: this.editForm.email.trim(),
      phoneNumber: this.editForm.phoneNumber.trim(),
      role: this.editForm.role.trim(),
    };
    if (password) payload.password = password;

    this.usersService.updateUser(this.currentUser._id, payload).subscribe({
      next: (response: any) => {
        const updatedUser = (response?.user ?? response) as Partial<Users>;
        const mergedUser = { ...this.currentUser, ...payload, ...updatedUser } as Users;
        this.currentUser = mergedUser;
        this.syncUserInLocalStorage(mergedUser);
        this.isSaving = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.saveError = err?.error?.message || 'Failed to update profile information.';
        this.isSaving = false;
      }
    });
  }

  openModal() {
    this.fillEditForm();
    this.saveError = '';
    this.showPassword = false;
    this.isOpen = true;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  updateEditField(
    field: 'firstName' | 'lastName' | 'email' | 'phoneNumber' | 'role' | 'password',
    value: string | number | null
  ) {
    this.editForm[field] = value == null ? '' : String(value);
  }

  private fillEditForm() {
    this.editForm.firstName = this.currentUser?.firstName || '';
    this.editForm.lastName = this.currentUser?.lastName || '';
    this.editForm.email = this.currentUser?.email || '';
    this.editForm.phoneNumber = this.currentUser?.phoneNumber || '';
    this.editForm.role = this.currentUser?.role ? String(this.currentUser.role) : '';
    this.editForm.password = '';
  }

  private syncUserInLocalStorage(user: Users) {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const localUser = JSON.parse(userStr);
      localStorage.setItem('user', JSON.stringify({ ...localUser, email: user.email }));
    } catch {
      // Ignore malformed local storage
    }
  }
}
