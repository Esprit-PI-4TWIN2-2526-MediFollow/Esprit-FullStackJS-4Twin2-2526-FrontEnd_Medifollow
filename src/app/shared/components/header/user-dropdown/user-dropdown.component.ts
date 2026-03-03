import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Users } from '../../../../models/users';
import { UsersService } from '../../../../services/user/users.service';

@Component({
  selector: 'app-user-dropdown',
  templateUrl: './user-dropdown.component.html',
})
export class UserDropdownComponent implements OnInit {
  isOpen = false;
  currentUser: Users | null = null;

  constructor(
    private router: Router,
    private usersService: UsersService
  ) { }

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const localUser = JSON.parse(userStr);
        const userEmail = localUser.email;

        // Fetch fresh data from API
        this.usersService.getUserByEmail(userEmail).subscribe({
          next: (user) => {
            this.currentUser = user;
            // Update localStorage with fresh data
            localStorage.setItem('user', JSON.stringify(user));
          },
          error: (err) => {
            console.error('Error fetching user:', err);
            // Fallback to localStorage data
            this.currentUser = localUser;
          }
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.currentUser = null;
      }
    } else {
      console.log('No user found in localStorage');
    }
  }

  getUserFullName(): string {
    if (!this.currentUser) return 'Guest User';
    const fullName = `${this.currentUser.firstName || ''} ${this.currentUser.lastName || ''}`.trim();
    return fullName || 'User';
  }

  getUserFirstName(): string {
    return this.currentUser?.firstName || 'Guest';
  }

  getUserEmail(): string {
    return this.currentUser?.email || 'No email';
  }

  getUserAvatar(): string | null {
    return this.currentUser?.avatarUrl || null;
  }

  hasAvatar(): boolean {
    return !!this.currentUser?.avatarUrl;
  }

  signOut() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/signin']);
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  closeDropdown() {
    this.isOpen = false;
  }
}
