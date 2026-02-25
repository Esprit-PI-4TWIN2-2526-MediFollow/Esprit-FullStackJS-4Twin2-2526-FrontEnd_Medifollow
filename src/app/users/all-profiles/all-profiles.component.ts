import { Component, OnInit } from '@angular/core';
import { Users } from '../../models/users';
import { UsersService } from '../../services/users.service';

@Component({
  selector: 'app-all-profiles',
  templateUrl: './all-profiles.component.html',
  styleUrls: ['./all-profiles.component.css']
})
export class AllProfilesComponent implements OnInit {

  users: Users[] = [];
  currentPage = 1;
  itemsPerPage = 6;
  selectedUserToDelete: Users | null = null;

  constructor(private usersService: UsersService) { }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (res: Users[]) => this.users = res,
      error: (err) => console.error(err)
    });
  }

  get totalPages(): number {
    return Math.ceil(this.users.length / this.itemsPerPage);
  }

  get currentItems(): Users[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.users.slice(start, start + this.itemsPerPage);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  handleViewMore(user: Users) {

    this.usersService.getUserById(user.id!).subscribe({
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


    this.usersService.deleteUser(this.selectedUserToDelete.id!).subscribe({
      next: () => {
        console.log('User deleted:', this.selectedUserToDelete);
        this.loadUsers();
        this.selectedUserToDelete = null; // fermer popup
      },
      error: (err) => console.error(err)
    });
  }

  cancelDelete() {
    this.selectedUserToDelete = null; // fermer popup
  }


  getBadgeColor(user: Users): 'success' | 'warning' | 'error' {
    if (user.actif) return 'success';
    return 'error';
  }
}
