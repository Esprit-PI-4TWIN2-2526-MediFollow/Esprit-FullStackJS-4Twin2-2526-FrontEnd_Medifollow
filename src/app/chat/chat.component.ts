// src/app/communication/chat/chat.component.ts
import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Message } from '../models/message';
import { CommunicationService } from '../services/communication/communication.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  // ── Contacts (colonne 1) ───────────────────────────────────────────────────
  contacts: any[] = [];
  loading = false;
  activeContactId: string | null = null;
  searchQuery = '';
  filteredContacts: any[] = [];

  // ── Chat (colonne 2) ───────────────────────────────────────────────────────
  messages: Message[] = [];
  newMessage = '';
  typingInfo: { name: string; isTyping: boolean } | null = null;
  currentRoomId: string | null = null;
  isConnected = false;

  // ── Attachments ────────────────────────────────────────────────────────────
  pendingAttachment: { type: string; file: File; previewUrl: string; name: string } | null = null;
  uploadError: string | null = null;
  isPreparingAttachment = false;
  isRecording = false;

  // ── Fiche patient (colonne 3) ──────────────────────────────────────────────
  recipient: { firstName: string; lastName: string; avatarUrl?: string; isOnline?: boolean } | null = null;
  recipientRole: string | null = null;
  patientInfo: { age?: string; room?: string; service?: string; exitDate?: string } | null = null;

  // ── Utilisateur connecté ───────────────────────────────────────────────────
  currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  private typingTimeout: any;
  private destroy$ = new Subject<void>();

  constructor(
    private communicationService: CommunicationService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.communicationService.connect();
    this.loadContacts();

    // Si une route avec targetUserId est déjà active (ex: /doctor/chat/:id)
    const targetUserId = this.route.snapshot.paramMap.get('targetUserId');
    if (targetUserId) {
      this.activeContactId = targetUserId;
      this.communicationService.joinRoom(targetUserId);
      this.loadRecipientInfo(targetUserId);
    }

    // Écoute les changements de route enfant
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('targetUserId');
      if (id && id !== this.activeContactId) {
        this.activeContactId = id;
        this.communicationService.joinRoom(id);
        this.loadRecipientInfo(id);
      }
    });

    // Souscriptions réactives
    this.communicationService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(msgs => this.messages = msgs);

    this.communicationService.getTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe(t => this.typingInfo = t);

    this.communicationService.getCurrentRoomId()
      .pipe(takeUntil(this.destroy$))
      .subscribe(id => this.currentRoomId = id);

    this.communicationService.isConnected()
      .pipe(takeUntil(this.destroy$))
      .subscribe(c => this.isConnected = c);

    // Initialize filtered contacts
    this.filteredContacts = this.contacts;
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  // ── Contacts ───────────────────────────────────────────────────────────────
  loadContacts(): void {
    this.loading = true;
    const currentUserRole = this.getRoleFromUser(this.currentUser).toUpperCase();
    const currentUserId = this.currentUser._id;

    this.http.get<any[]>(`${environment.apiUrl}/api/users/all`).subscribe({
      next: (data) => {
        let filtered: any[] = [];

        if (currentUserRole === 'DOCTOR') {
          filtered = data.filter(u => this.getRoleFromUser(u).toUpperCase() === 'PATIENT');
        } else if (currentUserRole === 'PATIENT') {
          filtered = data.filter(u => this.getRoleFromUser(u).toUpperCase() === 'DOCTOR');
        } else if (currentUserRole === 'NURSE') {
          filtered = data.filter(u => ['DOCTOR', 'PATIENT'].includes(this.getRoleFromUser(u).toUpperCase()));
        } else {
          filtered = data.filter(u => u._id !== currentUserId);
        }

        this.contacts = filtered
          .filter(u => u._id !== currentUserId)
          .map(u => ({
            ...u,
            // Valeurs par défaut pour lastMessage / unreadCount
            // À remplacer par des données réelles depuis votre API
            lastMessage: u.lastMessage || null,
            lastMessageTime: u.lastMessageTime || null,
            unreadCount: u.unreadCount || 0,
            isOnline: u.isOnline || false,
          }));

        this.filteredContacts = this.contacts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement contacts:', err);
        this.loading = false;
      }
    });
  }

  openChat(targetUserId: string): void {
    this.activeContactId = targetUserId;
    this.communicationService.joinRoom(targetUserId);
    this.loadRecipientInfo(targetUserId);

    const role = this.getRoleFromUser(this.currentUser).toUpperCase();
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

  // Charge les infos du destinataire pour la fiche patient (colonne 3)
  loadRecipientInfo(userId: string): void {
    const contact = this.contacts.find(c => c._id === userId);
    if (contact) {
      this.recipient = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        avatarUrl: contact.avatarUrl,
        isOnline: contact.isOnline,
      };
      this.recipientRole = this.getRoleName(contact);
      // À adapter selon votre modèle de données
      this.patientInfo = {
        age: contact.age || null,
        room: contact.room || null,
        service: contact.service || 'Post-hosp.',
        exitDate: contact.exitDate || null,
      };
    } else {
      // Fetch si pas encore dans la liste
      this.http.get<any>(`${environment.apiUrl}/api/users/${userId}`).subscribe({
        next: (user) => {
          this.recipient = {
            firstName: user.firstName,
            lastName: user.lastName,
            avatarUrl: user.avatarUrl,
            isOnline: user.isOnline,
          };
          this.recipientRole = this.getRoleName(user);
          this.patientInfo = {
            age: user.age || null,
            room: user.room || null,
            service: user.service || 'Post-hosp.',
            exitDate: user.exitDate || null,
          };
        },
        error: () => { this.recipient = null; }
      });
    }
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  sendMessage(): void {
    if (!this.newMessage.trim()) return;
    this.communicationService.sendMessage(this.newMessage);
    this.newMessage = '';
    this.communicationService.sendTyping(false);
  }

  onTyping(): void {
    this.communicationService.sendTyping(true);
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.communicationService.sendTyping(false);
    }, 1500);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isMyMessage(message: Message): boolean {
    return this.getUserId(message.sender) === this.getUserId(this.currentUser);
  }

  isFirstInGroup(current: Message, previous: Message | undefined): boolean {
    if (!previous) return true;
    return current.sender._id !== previous.sender._id;
  }

  isNewDay(current: Message, previous: Message | undefined): boolean {
    if (!previous) return true;
    const curr = new Date(current.createdAt);
    const prev = new Date(previous.createdAt);
    return curr.toDateString() !== prev.toDateString();
  }

  // ── Utilitaires ────────────────────────────────────────────────────────────
  getRoleName(user: any): string {
    if (user?.role?.name) return user.role.name;
    if (typeof user?.role === 'string') return user.role;
    return '';
  }

  getContactPreview(contact: any): string {
    return contact.lastMessage || 'No messages yet';
  }

  getMessageAttachments(message: Message, type: string): any[] {
    if (!message.attachments) return [];
    return message.attachments.filter((att: any) => att.type === type);
  }

  // ── Attachment Methods ─────────────────────────────────────────────────────
  openImagePicker(): void {
    const input = document.getElementById('imageInput') as HTMLInputElement;
    if (input) input.click();
  }

  onImageSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadError = null;
    this.isPreparingAttachment = true;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      this.uploadError = 'Please select a valid image file (JPEG, PNG, GIF, or WebP)';
      this.isPreparingAttachment = false;
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError = 'Image size must be less than 5MB';
      this.isPreparingAttachment = false;
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.pendingAttachment = {
        type: 'image',
        file: file,
        previewUrl: e.target.result,
        name: file.name
      };
      this.isPreparingAttachment = false;
    };
    reader.readAsDataURL(file);
  }

  removePendingAttachment(): void {
    this.pendingAttachment = null;
    this.uploadError = null;
  }

  toggleVoiceRecording(): void {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    this.isRecording = true;
    // TODO: Implement actual voice recording logic
    console.log('Starting voice recording...');
  }

  private stopRecording(): void {
    this.isRecording = false;
    // TODO: Implement actual voice recording stop logic
    console.log('Stopping voice recording...');
  }

  canSendMessage(): boolean {
    return !!(this.activeContactId && this.isConnected && (this.newMessage.trim() || this.pendingAttachment));
  }

  private getRoleFromUser(user: any): string {
    return this.getRoleName(user);
  }

  private getUserId(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return user._id ?? user.id ?? '';
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.typingTimeout);
  }
}
