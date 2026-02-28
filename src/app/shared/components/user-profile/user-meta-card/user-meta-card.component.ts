import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/users.service';

@Component({
  selector: 'app-user-meta-card',
  templateUrl: './user-meta-card.component.html',
  styles: ``
})
export class UserMetaCardComponent implements OnInit {

  constructor(
    public modal: ModalService,
    private usersService: UsersService
  ) {}

  isOpen = false;
  currentUser: Users | null = null;
  isLoading = true;

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    // Get user ID or email from localStorage
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

  getUserFullName(): string {
    if (!this.currentUser) return 'Guest User';
    return `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim() || 'User';
  }

  getUserRole(): string {
    return this.currentUser?.role?.toString() || 'No role';
  }

  getUserLocation(): string {
    return this.currentUser?.address || 'No location';
  }

  getUserAvatar(): string | null {
    return this.currentUser?.avatarUrl || null;
  }

  hasAvatar(): boolean {
    return !!this.currentUser?.avatarUrl;
  }

  getUserEmail(): string {
    return this.currentUser?.email || '';
  }

  getUserPhone(): string {
    return this.currentUser?.phoneNumber || '';
  }

  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  handleSave() {
    // Handle save logic here
    console.log('Saving changes...');
    this.modal.closeModal();
  }
}
