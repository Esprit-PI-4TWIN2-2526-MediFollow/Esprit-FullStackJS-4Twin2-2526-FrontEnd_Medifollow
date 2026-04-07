// src/app/communication/contacts/contacts.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="contacts-container">
      <h2>Messages</h2>

      <!-- Indicateur de chargement -->
      <div *ngIf="loading" class="loading">
        Chargement des contacts...
      </div>

      <div class="contacts-list">
        <div
          *ngFor="let contact of contacts"
          class="contact-item"
          (click)="openChat(contact._id)"
        >
          <img
            [src]="contact.avatarUrl || 'assets/default-avatar.png'"
            class="contact-avatar"
            [alt]="contact.firstName"
          />
          <div class="contact-info">
            <span class="contact-name">
              {{ contact.firstName }} {{ contact.lastName }}
            </span>
            <span class="contact-role">{{ getRoleName(contact) }}</span>
          </div>
        </div>

        <div *ngIf="!loading && contacts.length === 0" class="empty">
          Aucun contact disponible
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contacts-container { padding: 24px; max-width: 600px; margin: 0 auto; }
    h2 { margin-bottom: 16px; font-size: 20px; font-weight: 500; }
    .loading { text-align: center; padding: 32px; color: #888; }
    .contacts-list { display: flex; flex-direction: column; gap: 8px; }
    .contact-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 10px;
      cursor: pointer; border: 1px solid #eee;
      transition: background 0.2s;
    }
    .contact-item:hover { background: #f5f5f5; }
    .contact-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
    .contact-name { font-weight: 500; display: block; }
    .contact-role { font-size: 12px; color: #888; }
    .empty { color: #aaa; text-align: center; padding: 32px; }
  `]
})
export class ContactsComponent implements OnInit {
  contacts: any[] = [];
  loading: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  // Récupère le nom du rôle quel que soit le format
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

    console.log('Current user role:', currentUserRole);
    console.log('Current user ID:', currentUserId);

    // Utilise l'endpoint qui fonctionne
    const url = 'http://localhost:3000/api/users/all';

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        console.log('Tous les utilisateurs:', data);

        // Filtrer selon le rôle de l'utilisateur connecté
        let filteredContacts = [];

        if (currentUserRole === 'DOCTOR') {
          // Le docteur voit tous les PATIENTS
          filteredContacts = data.filter(user => {
            const userRole = this.getRoleName(user).toUpperCase();
            return userRole === 'PATIENT';
          });
        }
        else if (currentUserRole === 'PATIENT') {
          // Le patient voit tous les DOCTEURS
          filteredContacts = data.filter(user => {
            const userRole = this.getRoleName(user).toUpperCase();
            return userRole === 'DOCTOR';
          });
        }
        else if (currentUserRole === 'NURSE') {
          // L'infirmier voit DOCTEURS et PATIENTS
          filteredContacts = data.filter(user => {
            const userRole = this.getRoleName(user).toUpperCase();
            return userRole === 'DOCTOR' || userRole === 'PATIENT';
          });
        }
        else {
          // Autres rôles : voir tous sauf soi-même
          filteredContacts = data.filter(user => user._id !== currentUserId);
        }

        // Exclure l'utilisateur lui-même au cas où
        this.contacts = filteredContacts.filter(user => user._id !== currentUserId);

        console.log('Contacts filtrés:', this.contacts);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement contacts:', err);
        this.loading = false;
      }
    });
  }

  openChat(targetUserId: string): void {
    const currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');
    let role = this.getRoleName(currentUser).toUpperCase();

    const routes: Record<string, string> = {
      DOCTOR: '/doctor/chat',
      PATIENT: '/patient/chat',
      NURSE: '/nurse/chat',
    };

    const route = routes[role];
    if (route) {
      this.router.navigate([route, targetUserId]);
    } else {
      console.error('Route non trouvée pour le rôle:', role);
    }
  }
}
