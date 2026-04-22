import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject, catchError, throwError } from 'rxjs';
import { Message, MessageAttachment } from '../../models/message';

interface SendMessagePayload {
  content?: string;
  attachment?: MessageAttachment;
}

@Injectable({
  providedIn: 'root',
})
export class CommunicationService implements OnDestroy {
  private socket!: Socket;
  private readonly SERVER_URL = 'http://localhost:3000';
  private readonly API_URL = 'http://localhost:3000/api';
  private currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  private activeTargetUserId: string | null = null;

  private messages$ = new BehaviorSubject<Message[]>([]);
  private messageEvents$ = new Subject<Message>();
  private typing$ = new BehaviorSubject<{ name: string; isTyping: boolean } | null>(null);
  private currentRoomId$ = new BehaviorSubject<string | null>(null);
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  connect(): void {
    const token = localStorage.getItem('accessToken');
    if (!token || this.socket?.connected) return;

    this.socket = io(`${this.SERVER_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connecte');
      this.connected$.next(true);
      this.rejoinActiveRoom();
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Deconnecte');
      this.connected$.next(false);
    });

    this.socket.on('history', (messages: Message[]) => {
      this.messages$.next(messages.map(message => this.normalizeMessage(message)));
    });

    this.socket.on('room-joined', ({ roomId }: { roomId: string }) => {
      this.currentRoomId$.next(roomId);
      this.markAsRead(roomId);
    });

    this.socket.on('receive-message', (message: Message) => {
      const normalizedMessage = this.normalizeMessage(message);
      const current = this.messages$.getValue();
      const incomingSenderId = this.getUserId(normalizedMessage.sender);
      const optimisticIndex = current.findIndex(existing =>
        existing._id.startsWith('temp-')
        && existing.roomId === normalizedMessage.roomId
        && existing.content === normalizedMessage.content
        && this.getUserId(existing.sender) === incomingSenderId
        && this.getAttachmentSignature(existing.attachment) === this.getAttachmentSignature(normalizedMessage.attachment)
      );

      if (optimisticIndex >= 0) {
        const next = [...current];
        const mergedMessage = {
          ...normalizedMessage,
          sender: this.hasSenderIdentity(normalizedMessage.sender)
            ? normalizedMessage.sender
            : next[optimisticIndex].sender,
        };
        next[optimisticIndex] = mergedMessage;
        this.messages$.next(next);
        this.messageEvents$.next(mergedMessage);
        return;
      }

      const alreadyExists = current.some(existing => existing._id === normalizedMessage._id);
      if (!alreadyExists) {
        const previousSender = current.find(existing =>
          this.getUserId(existing.sender) === incomingSenderId
          && this.hasSenderIdentity(existing.sender),
        )?.sender;

        const appendedMessage = {
          ...normalizedMessage,
          sender: this.hasSenderIdentity(normalizedMessage.sender)
            ? normalizedMessage.sender
            : (previousSender ?? normalizedMessage.sender),
        };

        this.messages$.next([
          ...current,
          appendedMessage,
        ]);
        this.messageEvents$.next(appendedMessage);
      }

      if (
        normalizedMessage.roomId === this.currentRoomId$.getValue()
        && incomingSenderId !== this.getUserId(this.currentUser)
      ) {
        this.markAsRead(normalizedMessage.roomId);
      }
    });

    this.socket.on('typing', (data: { name: string; isTyping: boolean }) => {
      this.typing$.next(data);
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
    this.activeTargetUserId = targetUserId;
    if (!this.socket?.connected) return;
    this.socket.emit('join-room', { targetUserId });
  }

  sendMessage(payload: string | SendMessagePayload): void {
    const roomId = this.currentRoomId$.getValue();
    const normalizedPayload = typeof payload === 'string'
      ? { content: payload }
      : payload;
    const trimmedContent = normalizedPayload.content?.trim() ?? '';
    const attachment = normalizedPayload.attachment;

    if (!roomId || (!trimmedContent && !attachment) || !this.socket) return;

    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      roomId,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      read: false,
      type: this.resolveMessageType(trimmedContent, attachment),
      attachment,
      attachments: attachment ? [attachment] : [],
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
    this.socket.emit('send-message', {
      roomId,
      content: trimmedContent,
      type: optimisticMessage.type,
      attachment,
    });
  }

  uploadAttachment(file: File): Observable<{ attachment: MessageAttachment }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ attachment: MessageAttachment }>(
      `${this.API_URL}/chat/attachments`,
      formData,
    ).pipe(
      catchError(error => {
        if (error?.status !== 404) {
          return throwError(() => error);
        }

        return this.http.post<{ attachment: MessageAttachment }>(
          `${this.SERVER_URL}/chat/attachments`,
          formData,
        );
      }),
    );
  }

  sendTyping(isTyping: boolean): void {
    const roomId = this.currentRoomId$.getValue();
    if (!roomId || !this.socket) return;
    this.socket.emit('typing', { roomId, isTyping });
  }

  markAsRead(roomId: string): void {
    if (!this.socket) return;
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

  getMessages(): Observable<Message[]> {
    return this.messages$.asObservable();
  }

  getMessageEvents(): Observable<Message> {
    return this.messageEvents$.asObservable();
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

  private normalizeMessage(message: Message): Message {
    const attachment = this.normalizeAttachment(
      message.attachment
      ?? (Array.isArray(message.attachments) ? message.attachments[0] : undefined),
    );
    const attachments = attachment ? [attachment] : [];

    return {
      ...message,
      sender: this.normalizeSender(message.sender),
      content: message.content ?? '',
      attachment,
      attachments,
      type: message.type ?? this.resolveMessageType(message.content ?? '', attachments),
    };
  }

  private normalizeAttachment(attachment?: MessageAttachment): MessageAttachment | undefined {
    if (!attachment?.url) return undefined;

    return {
      ...attachment,
      name: attachment.name ?? attachment.originalName,
      size: attachment.size ?? attachment.bytes,
    };
  }

  private normalizeSender(sender: Message['sender'] | string): Message['sender'] {
    const senderId = this.getUserId(sender);

    if (typeof sender !== 'string') {
      return {
        _id: senderId,
        firstName: sender.firstName ?? '',
        lastName: sender.lastName ?? '',
        avatarUrl: sender.avatarUrl ?? '',
        isOnline: sender.isOnline,
      };
    }

    if (senderId === this.getUserId(this.currentUser)) {
      return {
        _id: senderId,
        firstName: this.currentUser?.firstName ?? '',
        lastName: this.currentUser?.lastName ?? '',
        avatarUrl: this.currentUser?.avatarUrl ?? '',
        isOnline: true,
      };
    }

    return {
      _id: senderId,
      firstName: '',
      lastName: '',
      avatarUrl: '',
      isOnline: false,
    };
  }

  private resolveMessageType(
    content: string,
    attachment?: MessageAttachment | MessageAttachment[],
  ): Message['type'] {
    const normalizedAttachments = Array.isArray(attachment)
      ? attachment
      : (attachment ? [attachment] : []);

    if (normalizedAttachments.length > 1 || (normalizedAttachments.length === 1 && content)) {
      return 'mixed';
    }

    if (normalizedAttachments[0]?.type === 'image') return 'image';
    if (normalizedAttachments[0]?.type === 'audio') return 'audio';
    return 'text';
  }

  private getAttachmentSignature(attachment?: MessageAttachment): string {
    if (!attachment) return '';
    return `${attachment.type}:${attachment.publicId ?? ''}:${attachment.url}`;
  }

  private hasSenderIdentity(sender: Message['sender']): boolean {
    return !!(sender.firstName || sender.lastName || sender.avatarUrl);
  }

  private rejoinActiveRoom(): void {
    if (!this.activeTargetUserId || !this.socket?.connected) return;
    this.socket.emit('join-room', { targetUserId: this.activeTargetUserId });
  }

  private getUserId(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return user._id ?? user.id ?? '';
  }
}
