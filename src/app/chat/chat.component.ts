// src/app/communication/chat/chat.component.ts
import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, AfterViewChecked
} from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Message } from '../models/message';
import { CommunicationService } from '../services/communication/communication.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-chat',
  standalone: true,                                     // ← standalone

  templateUrl: './chat.component.html',
  imports: [CommonModule, FormsModule, RouterModule],                 // ← ajoute FormsModule ici

  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
recipient: { firstName: string; lastName: string; avatarUrl?: string; isOnline?: boolean } | null = null;

  messages: Message[] = [];
  newMessage = '';
  typingInfo: { name: string; isTyping: boolean } | null = null;
  currentRoomId: string | null = null;
  isConnected = false;

  // Infos de l'utilisateur connecté depuis localStorage
  currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  private typingTimeout: any;
  private destroy$ = new Subject<void>();

  constructor(
    private communicationService: CommunicationService,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    // Connecte le socket au démarrage du composant
    this.communicationService.connect();

    // Récupère le targetUserId depuis la route
    // ex: /chat/:targetUserId
    const targetUserId = this.route.snapshot.paramMap.get('targetUserId');
    if (targetUserId) {
      this.communicationService.joinRoom(targetUserId);
    }

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
  }

  ngAfterViewChecked(): void {
    // Auto-scroll vers le bas à chaque nouveau message
    this.scrollToBottom();
  }

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

  // Vérifie si le message est de l'utilisateur connecté
  isMyMessage(message: Message): boolean {
    return message.sender._id === this.currentUser?._id;
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch { }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.typingTimeout);
    // Ne déconnecte pas ici — le service est providedIn root
    // Déconnecte uniquement au logout
  }
  // Vérifie si c'est le premier message d'un nouveau groupe (même expéditeur consécutif)
isFirstInGroup(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true;
  return current.sender._id !== previous.sender._id;
}

// Vérifie si le message est un nouveau jour par rapport au précédent
isNewDay(current: Message, previous: Message | undefined): boolean {
  if (!previous) return true;
  const curr = new Date(current.createdAt);
  const prev = new Date(previous.createdAt);
  return curr.toDateString() !== prev.toDateString();
}
}
