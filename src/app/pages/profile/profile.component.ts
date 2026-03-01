
import { Component, OnInit } from '@angular/core';
import { Users } from '../../models/users';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit {
  constructor(private usersService: UsersService) {}

  currentUser: Users | null = null;
  today = new Date();

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const localUser = JSON.parse(userStr);
      const userEmail = localUser.email;
      if (!userEmail) return;

      this.usersService.getUserByEmail(userEmail).subscribe({
        next: (user) => {
          this.currentUser = user;
        },
        error: (err) => {
          console.error('Error fetching user:', err);
        }
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  getWelcomeName(): string {
    return this.currentUser?.firstName?.trim() || 'there';
  }
}
