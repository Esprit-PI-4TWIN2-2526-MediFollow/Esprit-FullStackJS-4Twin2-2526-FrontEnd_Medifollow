// src/app/chat/chat.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule,FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <button (click)="goBack()">← Retour</button>
        <h3>{{ contactName }}</h3>
      </div>

      <div class="chat-messages">
        <div *ngFor="let message of messages" class="message" [class.own]="message.senderId === currentUserId">
          <strong>{{ message.senderName }}:</strong>
          <p>{{ message.content }}</p>
          <small>{{ message.createdAt | date:'HH:mm' }}</small>
        </div>
      </div>

      <div class="chat-input">
        <input [(ngModel)]="newMessage" placeholder="Écrivez votre message..." (keyup.enter)="sendMessage()">
        <button (click)="sendMessage()">Envoyer</button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; flex-direction: column; height: 100vh; max-width: 800px; margin: 0 auto; }
    .chat-header { padding: 16px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 16px; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 16px; }
    .message { margin-bottom: 16px; padding: 8px 12px; border-radius: 8px; background: #f5f5f5; }
    .message.own { background: #e3f2fd; text-align: right; }
    .chat-input { padding: 16px; border-top: 1px solid #eee; display: flex; gap: 8px; }
    .chat-input input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .chat-input button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
  `]
})
export class ChatComponent implements OnInit {
  messages: any[] = [];
  newMessage = '';
  contactName = '';
  currentUserId = '';
  targetUserId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.currentUserId = currentUser._id;

    this.targetUserId = this.route.snapshot.paramMap.get('targetUserId') || '';
    this.loadContactName();
    this.loadMessages();
  }

  loadContactName(): void {
    this.http.get(`http://localhost:3000/api/users/${this.targetUserId}`).subscribe((user: any) => {
      this.contactName = `${user.firstName} ${user.lastName}`;
    });
  }

  loadMessages(): void {
    // À implémenter avec ton service de messages
    this.http.get(`http://localhost:3000/api/messages/${this.currentUserId}/${this.targetUserId}`).subscribe({
      next: (data: any) => this.messages = data,
      error: (err) => console.error('Erreur chargement messages:', err)
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const message = {
      senderId: this.currentUserId,
      receiverId: this.targetUserId,
      content: this.newMessage,
      createdAt: new Date()
    };

    this.http.post('http://localhost:3000/api/messages', message).subscribe({
      next: () => {
        this.messages.push(message);
        this.newMessage = '';
      },
      error: (err) => console.error('Erreur envoi message:', err)
    });
  }

  goBack(): void {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const role = (currentUser?.role?.name || currentUser?.role || '').toUpperCase();
    const backRoutes: Record<string, string> = {
      DOCTOR: '/doctor/contacts',
      PATIENT: '/patient/contacts',
      NURSE: '/nurse/contacts'
    };
    this.router.navigate([backRoutes[role]]);
  }
}
