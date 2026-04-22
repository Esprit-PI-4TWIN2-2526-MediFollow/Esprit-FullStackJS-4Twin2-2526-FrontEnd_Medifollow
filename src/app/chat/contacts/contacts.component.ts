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
    <div class="contacts-page">
      

      <div class="toolbar">
        <div class="search-shell">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="7"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            class="search-bar"
            type="text"
            [placeholder]="searchPlaceholder"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
          />
        </div>
      </div>

      <div *ngIf="loading" class="state-card">Chargement des contacts...</div>

      <div *ngIf="!loading" class="contacts-grid">
        <button
          *ngFor="let contact of filteredContacts"
          type="button"
          class="contact-card"
          (click)="openChat(contact._id)"
        >
          <div class="contact-top">
            <div class="avatar" [ngClass]="getAvatarClass(contact)">
              <img
                *ngIf="contact.avatarUrl"
                [src]="contact.avatarUrl"
                [alt]="contact.firstName"
                class="avatar-img"
              />
              <span *ngIf="!contact.avatarUrl">{{ getInitials(contact) }}</span>
            </div>

            <span class="status-pill" [ngClass]="getBadgeClass(contact)">
              {{ getRoleLabel(contact) }}
            </span>
          </div>

          <div class="contact-body">
            <div class="contact-name">{{ contact.firstName }} {{ contact.lastName }}</div>
            <div class="contact-subtitle">{{ getContactSubtitle(contact) }}</div>
          </div>

          <div class="contact-footer">
            <span class="relationship-label">{{ getRelationshipLabel(contact) }}</span>
            <span class="chat-link">Open chat</span>
          </div>
        </button>

        <div *ngIf="filteredContacts.length === 0" class="state-card">
          Aucun contact correspondant n'a ete trouve.
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: calc(100vh - 120px);
    }

    .contacts-page {
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-height: 100%;
    }

    .hero {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      padding: 24px;
      border-radius: 28px;
      background: linear-gradient(135deg, #f7fbff 0%, #edf6ff 52%, #f8fbff 100%);
      border: 1px solid rgba(24, 95, 165, 0.10);
      box-shadow: 0 18px 40px rgba(17, 24, 39, 0.06);
    }

    .eyebrow {
      margin: 0 0 8px;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #6b7280;
      font-weight: 700;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.1;
      color: #111827;
      font-weight: 800;
    }

    .hero-copy {
      margin: 10px 0 0;
      max-width: 620px;
      color: #4b5563;
      font-size: 14px;
      line-height: 1.6;
    }

    .hero-count {
      min-width: 72px;
      height: 72px;
      border-radius: 22px;
      display: grid;
      place-items: center;
      background: #185fa5;
      color: #fff;
      font-size: 26px;
      font-weight: 800;
      box-shadow: 0 14px 28px rgba(24, 95, 165, 0.24);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .search-shell {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      max-width: 420px;
      padding: 0 14px;
      border-radius: 16px;
      border: 1px solid rgba(17, 24, 39, 0.08);
      background: #fff;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.04);
    }

    .search-shell svg {
      width: 16px;
      height: 16px;
      color: #9ca3af;
      flex-shrink: 0;
    }

    .search-bar {
      width: 100%;
      height: 48px;
      border: none;
      outline: none;
      font-size: 14px;
      color: #111827;
      background: transparent;
    }

    .contacts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 18px;
      align-items: stretch;
    }

    .contact-card {
      border: 1px solid rgba(17, 24, 39, 0.08);
      border-radius: 24px;
      background: #fff;
      padding: 18px;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 16px;
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      box-shadow: 0 12px 28px rgba(17, 24, 39, 0.05);
    }

    .contact-card:hover {
      transform: translateY(-2px);
      border-color: rgba(24, 95, 165, 0.24);
      box-shadow: 0 20px 36px rgba(17, 24, 39, 0.10);
    }

    .contact-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .av-blue { background: #e6f1fb; color: #0c447c; }
    .av-teal { background: #e1f5ee; color: #085041; }
    .av-purple { background: #eeedfe; color: #3c3489; }
    .av-amber { background: #faeeda; color: #633806; }
    .av-coral { background: #faece7; color: #712b13; }

    .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 30px;
      padding: 0 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .badge-doctor { background: #e6f1fb; color: #185fa5; }
    .badge-patient { background: #e1f5ee; color: #0f6e56; }
    .badge-nurse { background: #eeedfe; color: #534ab7; }
    .badge-default { background: #f3f4f6; color: #4b5563; }

    .contact-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 0;
    }

    .contact-name {
      font-size: 17px;
      font-weight: 700;
      color: #111827;
      line-height: 1.25;
      word-break: break-word;
    }

    .contact-subtitle {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.5;
      min-height: 40px;
    }

    .contact-footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid rgba(17, 24, 39, 0.07);
    }

    .relationship-label {
      font-size: 12px;
      color: #4b5563;
      font-weight: 600;
    }

    .chat-link {
      font-size: 12px;
      color: #185fa5;
      font-weight: 700;
    }

    .state-card {
      display: grid;
      place-items: center;
      min-height: 180px;
      border-radius: 24px;
      background: #fff;
      border: 1px dashed rgba(17, 24, 39, 0.14);
      color: #6b7280;
      font-size: 14px;
      text-align: center;
      padding: 20px;
    }

    @media (max-width: 768px) {
      :host {
        min-height: auto;
      }

      .hero {
        flex-direction: column;
        align-items: stretch;
      }

      .hero-count {
        min-width: 100%;
        height: 56px;
        border-radius: 18px;
      }

      .contacts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ContactsComponent implements OnInit {
  contacts: any[] = [];
  filteredContacts: any[] = [];
  searchQuery = '';
  loading = false;

  private avatarClasses = ['av-blue', 'av-teal', 'av-coral', 'av-purple', 'av-amber'];
  private currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.loadContacts();
  }

  get pageEyebrow(): string {
    return this.isDoctor() ? 'Doctor workspace' : this.isPatient() ? 'Patient workspace' : 'Contacts';
  }

  get pageTitle(): string {
    return this.isDoctor() ? 'Your patients' : this.isPatient() ? 'Your doctors' : 'Your contacts';
  }

  get pageDescription(): string {
    if (this.isDoctor()) {
      return 'Only the patients attached to your profile appear here, so you can start the right conversation quickly.';
    }

    if (this.isPatient()) {
      return 'Only the doctors linked to your profile appear here, for a cleaner and safer messaging experience.';
    }

    return 'Open a conversation with the people assigned to your role.';
  }

  get searchPlaceholder(): string {
    return this.isDoctor() ? 'Search a patient...' : this.isPatient() ? 'Search a doctor...' : 'Search a contact...';
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
    if (role === 'DOCTOR') return 'badge-doctor';
    if (role === 'PATIENT') return 'badge-patient';
    if (role === 'NURSE') return 'badge-nurse';
    return 'badge-default';
  }

  getRoleLabel(user: any): string {
    const role = this.getRoleName(user).toUpperCase();
    if (role === 'DOCTOR') return 'Doctor';
    if (role === 'PATIENT') return 'Patient';
    if (role === 'NURSE') return 'Nurse';
    return role || 'Contact';
  }

  getContactSubtitle(user: any): string {
    if (this.isDoctor()) {
      return user.email || user.assignedDepartment || 'Patient linked to your follow-up.';
    }

    if (this.isPatient()) {
      return user.specialization || user.email || 'Doctor linked to your profile.';
    }

    return user.email || 'Messaging contact';
  }

  getRelationshipLabel(user: any): string {
    if (this.isDoctor()) return 'Assigned patient';
    if (this.isPatient()) return 'Assigned doctor';
    return this.getRoleLabel(user);
  }

  onSearch(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredContacts = [...this.contacts];
      return;
    }

    this.filteredContacts = this.contacts.filter(contact =>
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(query)
      || String(contact.email ?? '').toLowerCase().includes(query)
      || String(contact.specialization ?? '').toLowerCase().includes(query)
    );
  }

  getRoleName(user: any): string {
    if (user?.role?.name) return user.role.name;
    if (typeof user?.role === 'string') return user.role;
    return 'UNKNOWN';
  }

  loadContacts(): void {
    this.loading = true;
    const currentUserRole = this.getRoleName(this.currentUser).toUpperCase();
    const currentUserId = this.currentUser._id;

    this.http.get<any[]>('http://localhost:3000/api/users/all').subscribe({
      next: data => {
        let filtered: any[] = [];

        if (currentUserRole === 'DOCTOR') {
          filtered = data.filter(user =>
            this.getRoleName(user).toUpperCase() === 'PATIENT'
            && this.matchesPrimaryDoctor(user, this.currentUser)
          );
        } else if (currentUserRole === 'PATIENT') {
          filtered = data.filter(user =>
            this.getRoleName(user).toUpperCase() === 'DOCTOR'
            && this.matchesDoctorForPatient(this.currentUser, user)
          );
        } else if (currentUserRole === 'NURSE') {
          filtered = data.filter(user =>
            ['DOCTOR', 'PATIENT'].includes(this.getRoleName(user).toUpperCase())
          );
        } else {
          filtered = data.filter(user => user._id !== currentUserId);
        }

        this.contacts = filtered.filter(user => user._id !== currentUserId);
        this.filteredContacts = [...this.contacts];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openChat(targetUserId: string): void {
    const role = this.getRoleName(this.currentUser).toUpperCase();
    const routes: Record<string, string> = {
      DOCTOR: '/doctor/chat',
      PATIENT: '/patient/chat',
      NURSE: '/nurse/chat',
    };
    const route = routes[role];
    if (route) {
      this.router.navigate([route, targetUserId]);
    }
  }

  private isDoctor(): boolean {
    return this.getRoleName(this.currentUser).toUpperCase() === 'DOCTOR';
  }

  private isPatient(): boolean {
    return this.getRoleName(this.currentUser).toUpperCase() === 'PATIENT';
  }

  private matchesPrimaryDoctor(patient: any, doctor: any): boolean {
    const primaryDoctor = this.normalizePersonName(patient?.primaryDoctor);
    if (!primaryDoctor) return false;

    return this.getDoctorNameCandidates(doctor).some(candidate => candidate === primaryDoctor);
  }

  private matchesDoctorForPatient(patient: any, doctor: any): boolean {
    const primaryDoctor = this.normalizePersonName(patient?.primaryDoctor);
    if (!primaryDoctor) return false;

    return this.getDoctorNameCandidates(doctor).some(candidate => candidate === primaryDoctor);
  }

  private getDoctorNameCandidates(user: any): string[] {
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    const candidates = [
      fullName,
      `Dr ${fullName}`.trim(),
      `Doctor ${fullName}`.trim(),
    ]
      .map(name => this.normalizePersonName(name))
      .filter(Boolean);

    return Array.from(new Set(candidates));
  }

  private normalizePersonName(value: string | undefined | null): string {
    return (value ?? '')
      .toLowerCase()
      .replace(/\b(dr|doctor)\.?\s+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
