// src/app/communication/contacts/contacts.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="contacts-wrap">

      <div class="contacts-header">
        <h2>Messages</h2>
        <span class="contacts-count">{{ filteredContacts.length }} contacts</span>
      </div>

      <input
        class="search-bar"
        type="text"
        placeholder="Search contact..."
        [(ngModel)]="searchQuery"
        (ngModelChange)="onSearch()"
      />

      <div *ngIf="loading" class="loading">Chargement des contacts...</div>

      <div class="grid" *ngIf="!loading">
        <div
          *ngFor="let contact of filteredContacts"
          class="card"
          (click)="openChat(contact._id)"
        >
          <div class="avatar" [ngClass]="getAvatarClass(contact)">
            <img
              *ngIf="contact.avatarUrl"
              [src]="contact.avatarUrl"
              [alt]="contact.firstName"
              class="avatar-img"
            />
            <span *ngIf="!contact.avatarUrl">{{ getInitials(contact) }}</span>
          </div>

          <div class="card-name">{{ contact.firstName }} {{ contact.lastName }}</div>

          <span class="badge" [ngClass]="getBadgeClass(contact)">
            {{ getRoleName(contact) }}
          </span>
        </div>

        <div *ngIf="filteredContacts.length === 0" class="empty">
          Aucun contact trouvé
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contacts-wrap {
      padding: 0px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .contacts-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    h2 {
      font-size: 20px;
      font-weight: 500;
      margin: 0;
    }

    .contacts-count {
      font-size: 13px;
      color: #888;
      background: #f5f5f5;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid #eee;
    }

    .search-bar {
      width: 100%;
      padding: 9px 14px;
      border-radius: 8px;
      border: 1px solid #ddd;
      font-size: 14px;
      box-sizing: border-box;
      margin-bottom: 20px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-bar:focus {
      border-color: #999;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 12px;
    }

    .card {
      background: #fff;
      border: 1px solid #eee;
      border-radius: 12px;
      padding: 20px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }

    .card:hover {
      border-color: #ccc;
      background: #fafafa;
    }

    .avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      font-weight: 500;
      margin-bottom: 10px;
      overflow: hidden;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .av-blue   { background: #E6F1FB; color: #0C447C; }
    .av-teal   { background: #E1F5EE; color: #085041; }
    .av-coral  { background: #FAECE7; color: #712B13; }
    .av-purple { background: #EEEDFE; color: #3C3489; }
    .av-amber  { background: #FAEEDA; color: #633806; }

    .card-name {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .badge {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 500;
    }

    .badge-doctor  { background: #E6F1FB; color: #185FA5; }
    .badge-patient { background: #E1F5EE; color: #0F6E56; }
    .badge-nurse   { background: #EEEDFE; color: #534AB7; }
    .badge-default { background: #f5f5f5; color: #555; }

    .loading, .empty {
      text-align: center;
      color: #aaa;
      padding: 48px 0;
      grid-column: 1 / -1;
    }
  `]
})
export class ContactsComponent implements OnInit {
  contacts: any[] = [];
  filteredContacts: any[] = [];
  searchQuery: string = '';
  loading: boolean = false;

  private avatarClasses = ['av-blue', 'av-teal', 'av-coral', 'av-purple', 'av-amber'];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  getInitials(user: any): string {
    const first = user.firstName?.charAt(0) ?? '';
    const last = user.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase();
  }

  getAvatarClass(user: any): string {
    const role = this.getRoleName(user).toUpperCase();
    if (role === 'DOCTOR') return 'av-blue';
    if (role === 'PATIENT') return 'av-teal';
    if (role === 'NURSE') return 'av-purple';
    const index = (user._id?.charCodeAt(0) ?? 0) % this.avatarClasses.length;
    return this.avatarClasses[index];
  }

  getBadgeClass(user: any): string {
    const role = this.getRoleName(user).toUpperCase();
    if (role === 'DOCTOR') return 'badge badge-doctor';
    if (role === 'PATIENT') return 'badge badge-patient';
    if (role === 'NURSE') return 'badge badge-nurse';
    return 'badge badge-default';
  }

  onSearch(): void {
    const q = this.searchQuery.toLowerCase();
    this.filteredContacts = this.contacts.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q)
    );
  }

  public getRoleName(user: any): string {
    if (user.role?.name) return user.role.name;
    if (typeof user.role === 'string') return user.role;
    return 'Inconnu';
  }

  loadContacts(): void {
    this.loading = true;
    const currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');
    const currentUserRole = this.getRoleName(currentUser).toUpperCase();
    const currentUserId = currentUser._id;

    this.http.get<any[]>('http://localhost:3000/api/users/all').subscribe({
      next: (data) => {
        let filtered = [];

        if (currentUserRole === 'DOCTOR') {
          filtered = data.filter(u => this.getRoleName(u).toUpperCase() === 'PATIENT');
        } else if (currentUserRole === 'PATIENT') {
          filtered = data.filter(u => this.getRoleName(u).toUpperCase() === 'DOCTOR');
        } else if (currentUserRole === 'NURSE') {
          filtered = data.filter(u => ['DOCTOR', 'PATIENT'].includes(this.getRoleName(u).toUpperCase()));
        } else {
          filtered = data.filter(u => u._id !== currentUserId);
        }

        this.contacts = filtered.filter(u => u._id !== currentUserId);
        this.filteredContacts = [...this.contacts];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  openChat(targetUserId: string): void {
    const currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');
    const role = this.getRoleName(currentUser).toUpperCase();
    const routes: Record<string, string> = {
      DOCTOR: '/doctor/chat',
      PATIENT: '/patient/chat',
      NURSE: '/nurse/chat',
    };
    const route = routes[role];
    if (route) this.router.navigate([route, targetUserId]);
  }
}
