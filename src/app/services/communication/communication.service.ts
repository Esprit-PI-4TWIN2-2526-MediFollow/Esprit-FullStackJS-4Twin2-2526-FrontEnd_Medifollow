// src/app/services/communication/communication.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from '../../models/message';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService implements OnDestroy {
  private socket!: Socket;
  private readonly SERVER_URL = 'http://localhost:3000';
  private currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  // Streams réactifs pour les composants
  private messages$ = new BehaviorSubject<Message[]>([]);
  private typing$ = new BehaviorSubject<{ name: string; isTyping: boolean } | null>(null);
  private currentRoomId$ = new BehaviorSubject<string | null>(null);
  private connected$ = new BehaviorSubject<boolean>(false);

  connect(): void {
    const token = localStorage.getItem('accessToken');
    if (!token || this.socket?.connected) return;

    this.socket = io(`${this.SERVER_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connecté');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Déconnecté');
      this.connected$.next(false);
    });

    this.socket.on('history', (messages: Message[]) => {
      this.messages$.next(messages);
    });

    this.socket.on('receive-message', (message: Message) => {
      const current = this.messages$.getValue();
      const incomingSenderId = this.getUserId(message.sender);
      const optimisticIndex = current.findIndex(existing =>
        existing._id.startsWith('temp-') &&
        existing.roomId === message.roomId &&
        existing.content === message.content &&
        this.getUserId(existing.sender) === incomingSenderId
      );

      if (optimisticIndex >= 0) {
        const next = [...current];
        next[optimisticIndex] = message;
        this.messages$.next(next);
        return;
      }

      const alreadyExists = current.some(existing => existing._id === message._id);
      if (!alreadyExists) {
        this.messages$.next([...current, message]);
      }
    });

    this.socket.on('typing', (data: { name: string; isTyping: boolean }) => {
      this.typing$.next(data);
      // Efface l'indicateur après 2s
      if (data.isTyping) {
        setTimeout(() => this.typing$.next(null), 2000);
      }
    });

    this.socket.on('messages-read', () => {
      const updated = this.messages$.getValue().map(m => ({ ...m, read: true }));
      this.messages$.next(updated);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.error('[Socket] Erreur :', err.message);
    });
  }

  joinRoom(targetUserId: string): void {
    this.socket.emit('join-room', { targetUserId });

    this.socket.once('room-joined', ({ roomId }: { roomId: string }) => {
      this.currentRoomId$.next(roomId);
      this.markAsRead(roomId);
    });
  }

  sendMessage(content: string): void {
    const roomId = this.currentRoomId$.getValue();
    if (!roomId || !content.trim()) return;

    const trimmedContent = content.trim();
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      roomId,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      read: false,
      senderRoleName: this.currentUser?.role?.name ?? this.currentUser?.role ?? '',
      sender: {
        _id: this.getUserId(this.currentUser),
        firstName: this.currentUser?.firstName ?? '',
        lastName: this.currentUser?.lastName ?? '',
        avatarUrl: this.currentUser?.avatarUrl ?? '',
        isOnline: true,
      },
    };

    this.messages$.next([...this.messages$.getValue(), optimisticMessage]);
    this.socket.emit('send-message', { roomId, content: trimmedContent });
  }

  sendTyping(isTyping: boolean): void {
    const roomId = this.currentRoomId$.getValue();
    if (!roomId) return;
    this.socket.emit('typing', { roomId, isTyping });
  }

  markAsRead(roomId: string): void {
    this.socket.emit('mark-read', { roomId });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.messages$.next([]);
      this.currentRoomId$.next(null);
      this.connected$.next(false);
    }
  }

  // Getters pour les composants
  getMessages(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  getCurrentRoomId(): Observable<string | null> {
    return this.currentRoomId$.asObservable();
  }

  getTyping(): Observable<{ name: string; isTyping: boolean } | null> {
    return this.typing$.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private getUserId(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return user._id ?? user.id ?? '';
  }
}
