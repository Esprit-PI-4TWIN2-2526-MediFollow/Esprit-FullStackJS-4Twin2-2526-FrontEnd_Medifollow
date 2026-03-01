import { Component, OnInit } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/users.service';

@Component({
  selector: 'app-user-info-card',
  templateUrl: './user-info-card.component.html',
  styles: ``
})
export class UserInfoCardComponent implements OnInit {

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

  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  handleSave() {
    // Handle save logic here
    console.log('Saving changes...');
    this.modal.closeModal();
  }
}
