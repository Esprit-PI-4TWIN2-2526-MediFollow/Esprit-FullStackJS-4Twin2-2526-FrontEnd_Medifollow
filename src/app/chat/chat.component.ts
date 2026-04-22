import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Message, MessageAttachment } from '../models/message';
import { CommunicationService } from '../services/communication/communication.service';

interface PendingAttachment {
  type: MessageAttachment['type'];
  file: File;
  previewUrl: string;
  name: string;
  mimeType: string;
  size: number;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [CommonModule, FormsModule, RouterModule],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('imageInput') imageInput?: ElementRef<HTMLInputElement>;

  contacts: any[] = [];
  searchQuery = '';
  loading = false;
  contactsLoaded = false;
  activeContactId: string | null = null;

  messages: Message[] = [];
  newMessage = '';
  pendingAttachment: PendingAttachment | null = null;
  typingInfo: { name: string; isTyping: boolean } | null = null;
  currentRoomId: string | null = null;
  isConnected = false;
  isRecording = false;
  isPreparingAttachment = false;
  uploadError = '';

  recipient: { firstName: string; lastName: string; avatarUrl?: string; isOnline?: boolean } | null = null;
  recipientRole: string | null = null;
  patientInfo: { age?: string; room?: string; service?: string; exitDate?: string } | null = null;

  currentUser = JSON.parse(localStorage.getItem('user') ?? '{}');

  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private destroy$ = new Subject<void>();
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private shouldScrollToBottom = false;

  constructor(
    private communicationService: CommunicationService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.communicationService.connect();
    this.loadContacts();

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('targetUserId');

      if (!id) {
        this.activeContactId = null;
        this.recipient = null;
        this.messages = [];
        this.pendingAttachment = null;
        this.uploadError = '';
        return;
      }

      this.activeContactId = id;
      if (this.contactsLoaded) {
        this.activateContact(id);
      }
    });

    this.communicationService.getMessages()
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.shouldScrollToBottom = this.activeContactId
          ? this.isNearBottom()
          : false;
        this.messages = messages;
      });

    this.communicationService.getMessageEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleIncomingMessage(message);
      });

    this.communicationService.getTyping()
      .pipe(takeUntil(this.destroy$))
      .subscribe(typing => {
        this.typingInfo = typing;
      });

    this.communicationService.getCurrentRoomId()
      .pipe(takeUntil(this.destroy$))
      .subscribe(roomId => {
        this.currentRoomId = roomId;
      });

    this.communicationService.isConnected()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
      });
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScrollToBottom) {
      return;
    }

    this.scrollToBottom();
    this.shouldScrollToBottom = false;
  }

  loadContacts(): void {
    this.loading = true;
    const currentUserRole = this.getRoleFromUser(this.currentUser).toUpperCase();
    const currentUserId = this.currentUser._id;

    this.http.get<any[]>('http://localhost:3000/api/users/all').subscribe({
      next: data => {
        let filtered: any[] = [];

        if (currentUserRole === 'DOCTOR') {
          filtered = data.filter(user =>
            this.getRoleFromUser(user).toUpperCase() === 'PATIENT'
            && this.matchesPrimaryDoctor(user, this.currentUser)
          );
        } else if (currentUserRole === 'PATIENT') {
          filtered = data.filter(user =>
            this.getRoleFromUser(user).toUpperCase() === 'DOCTOR'
            && this.matchesDoctorForPatient(this.currentUser, user)
          );
        } else if (currentUserRole === 'NURSE') {
          filtered = data.filter(user =>
            ['DOCTOR', 'PATIENT'].includes(this.getRoleFromUser(user).toUpperCase())
          );
        } else {
          filtered = data.filter(user => user._id !== currentUserId);
        }

        this.contacts = filtered
          .filter(user => user._id !== currentUserId)
          .map(user => ({
            ...user,
            lastMessage: user.lastMessage || null,
            lastMessageTime: user.lastMessageTime || null,
            unreadCount: user.unreadCount || 0,
            isOnline: user.isOnline || false,
          }));

        this.loading = false;
        this.contactsLoaded = true;

        if (this.activeContactId) {
          this.activateContact(this.activeContactId);
        }
      },
      error: err => {
        console.error('Erreur chargement contacts:', err);
        this.loading = false;
        this.contactsLoaded = true;
      }
    });
  }

  openChat(targetUserId: string): void {
    this.activeContactId = targetUserId;
    this.shouldScrollToBottom = true;
    this.activateContact(targetUserId);

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

  get filteredContacts(): any[] {
    const query = this.searchQuery.trim().toLowerCase();

    if (!query) {
      return this.contacts;
    }

    return this.contacts.filter(contact => {
      const fullName = `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.toLowerCase();
      const role = this.getRoleName(contact).toLowerCase();
      const email = String(contact.email ?? '').toLowerCase();

      return fullName.includes(query) || role.includes(query) || email.includes(query);
    });
  }

  loadRecipientInfo(userId: string): void {
    const contact = this.contacts.find(item => item._id === userId);
    if (contact) {
      this.recipient = {
        firstName: contact.firstName,
        lastName: contact.lastName,
        avatarUrl: contact.avatarUrl,
        isOnline: contact.isOnline,
      };
      this.recipientRole = this.getRoleName(contact);
      this.patientInfo = {
        age: contact.age || null,
        room: contact.room || null,
        service: contact.service || 'Post-hosp.',
        exitDate: contact.exitDate || null,
      };
      return;
    }

    this.http.get<any>(`http://localhost:3000/api/users/${userId}`).subscribe({
      next: user => {
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
      error: () => {
        this.recipient = null;
      }
    });
  }

  getContactPreview(contact: any): string {
    return contact.lastMessage || this.getRoleName(contact);
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    const pendingAttachment = this.pendingAttachment;

    if (!content && !pendingAttachment) return;

    this.uploadError = '';

    if (!pendingAttachment) {
      this.shouldScrollToBottom = true;
      this.communicationService.sendMessage({ content });
      this.newMessage = '';
      this.communicationService.sendTyping(false);
      return;
    }

    this.isPreparingAttachment = true;
    this.communicationService.uploadAttachment(pendingAttachment.file)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isPreparingAttachment = false;
        }),
      )
      .subscribe({
        next: ({ attachment }) => {
          this.shouldScrollToBottom = true;
          this.communicationService.sendMessage({ content, attachment });
          this.newMessage = '';
          this.pendingAttachment = null;
          this.communicationService.sendTyping(false);
        },
        error: error => {
          console.error('Erreur upload piece jointe:', error);
          this.uploadError = this.getUploadErrorMessage(error);
        },
      });
  }

  onTyping(): void {
    this.communicationService.sendTyping(true);
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

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

  canSendMessage(): boolean {
    return !!this.activeContactId
      && this.isConnected
      && (!!this.newMessage.trim() || !!this.pendingAttachment)
      && !this.isPreparingAttachment;
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.isSupportedImage(file)) {
      this.uploadError = 'Format image non supporte. Utilisez JPG, PNG ou WEBP.';
      input.value = '';
      return;
    }

    if (!this.isWithinMaxFileSize(file)) {
      this.uploadError = 'Le fichier depasse la taille maximale de 10 Mo.';
      input.value = '';
      return;
    }

    this.isPreparingAttachment = true;
    try {
      const url = await this.readFileAsDataUrl(file);
      this.pendingAttachment = {
        type: 'image',
        file,
        previewUrl: url,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      };
      this.uploadError = '';
    } finally {
      this.isPreparingAttachment = false;
      input.value = '';
    }
  }

  openImagePicker(): void {
    this.imageInput?.nativeElement.click();
  }

  async toggleVoiceRecording(): Promise<void> {
    if (this.isRecording) {
      this.stopVoiceRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      const recordingMimeType = this.getSupportedRecordingMimeType();
      this.mediaRecorder = recordingMimeType
        ? new MediaRecorder(stream, { mimeType: recordingMimeType })
        : new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const rawMimeType = this.mediaRecorder?.mimeType || recordingMimeType || 'audio/webm';
        const mimeType = this.stripMimeTypeParameters(rawMimeType);
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const url = await this.readBlobAsDataUrl(audioBlob);
        const extension = this.getExtensionFromMimeType(mimeType) ?? 'webm';
        const file = new File(
          [audioBlob],
          `voice-note-${Date.now()}.${extension}`,
          { type: mimeType },
        );

        if (!this.isSupportedAudio(file)) {
          this.uploadError = 'Format audio non supporte par le backend.';
          stream.getTracks().forEach(track => track.stop());
          this.mediaRecorder = null;
          this.audioChunks = [];
          this.isRecording = false;
          return;
        }

        if (!this.isWithinMaxFileSize(file)) {
          this.uploadError = 'Le fichier audio depasse la taille maximale de 10 Mo.';
          stream.getTracks().forEach(track => track.stop());
          this.mediaRecorder = null;
          this.audioChunks = [];
          this.isRecording = false;
          return;
        }

        this.pendingAttachment = {
          type: 'audio',
          file,
          previewUrl: url,
          name: file.name,
          mimeType,
          size: audioBlob.size,
        };
        this.uploadError = '';
        stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Unable to start voice recording:', error);
      this.isRecording = false;
    }
  }

  stopVoiceRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  removePendingAttachment(): void {
    this.pendingAttachment = null;
    this.uploadError = '';
  }

  formatAudioDuration(durationSeconds?: number): string {
    if (!durationSeconds || durationSeconds <= 0) return 'Audio';

    const totalSeconds = Math.round(durationSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  formatAttachmentSize(bytes?: number): string {
    if (!bytes || bytes <= 0) return '';

    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getMessageAttachments(message: Message, type?: MessageAttachment['type']): MessageAttachment[] {
    const attachments = message.attachments ?? (message.attachment ? [message.attachment] : []);
    return type ? attachments.filter(attachment => attachment.type === type) : attachments;
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

  getRoleName(user: any): string {
    if (user?.role?.name) return user.role.name;
    if (typeof user?.role === 'string') return user.role;
    return '';
  }

  private getRoleFromUser(user: any): string {
    return this.getRoleName(user);
  }

  private activateContact(targetUserId: string): void {
    const contact = this.contacts.find(item => item._id === targetUserId);
    if (!contact) {
      this.activeContactId = null;
      this.recipient = null;
      this.messages = [];
      this.pendingAttachment = null;
      this.shouldScrollToBottom = false;
      return;
    }

    this.updateContactState(targetUserId, { unreadCount: 0 });
    this.communicationService.joinRoom(targetUserId);
    this.loadRecipientInfo(targetUserId);
  }

  private handleIncomingMessage(message: Message): void {
    const senderId = this.getUserId(message.sender);
    const currentUserId = this.getUserId(this.currentUser);
    const isMine = senderId === currentUserId;
    const targetUserId = isMine ? this.activeContactId : senderId;

    if (!targetUserId) {
      return;
    }

    const contentPreview = this.buildMessagePreview(message);
    const isActiveConversation = targetUserId === this.activeContactId;
    const nextUnreadCount = isMine || isActiveConversation
      ? 0
      : this.getContactUnreadCount(targetUserId) + 1;

    this.updateContactState(targetUserId, {
      lastMessage: contentPreview,
      lastMessageTime: this.formatContactTime(message.createdAt),
      unreadCount: nextUnreadCount,
    });
  }

  private buildMessagePreview(message: Message): string {
    const content = message.content?.trim();
    if (content) {
      return content;
    }

    if (message.attachment?.type === 'image') {
      return 'Image';
    }

    if (message.attachment?.type === 'audio') {
      return 'Vocal';
    }

    return 'Nouveau message';
  }

  private updateContactState(contactId: string, updates: Partial<any>): void {
    this.contacts = this.contacts.map(contact =>
      contact._id === contactId
        ? { ...contact, ...updates }
        : contact,
    );
  }

  private getContactUnreadCount(contactId: string): number {
    return this.contacts.find(contact => contact._id === contactId)?.unreadCount ?? 0;
  }

  private formatContactTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  private getUserId(user: any): string {
    if (!user) return '';
    if (typeof user === 'string') return user;
    return user._id ?? user.id ?? '';
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  private getExtensionFromMimeType(mimeType: string): string | null {
    const map: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/x-m4a': 'm4a',
      'audio/aac': 'aac',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/ogg': 'ogg',
    };

    return map[mimeType] ?? null;
  }

  private getSupportedRecordingMimeType(): string | null {
    if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
      return null;
    }

    const preferredTypes = [
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg',
    ];

    return preferredTypes.find(type => MediaRecorder.isTypeSupported(type)) ?? null;
  }

  private stripMimeTypeParameters(mimeType: string): string {
    return mimeType.split(';')[0].trim().toLowerCase();
  }

  private isSupportedImage(file: File): boolean {
    return /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  }

  private isSupportedAudio(file: File): boolean {
    return (
      /^audio\/(mpeg|mp3|wav|webm|ogg|aac|x-m4a)$/i.test(file.type)
      || /^video\/(mp4|webm|ogg)$/i.test(file.type)
    );
  }

  private isWithinMaxFileSize(file: File): boolean {
    return file.size <= 10 * 1024 * 1024;
  }

  private getUploadErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = error.error?.message;

      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return String(backendMessage[0]);
      }

      if (typeof backendMessage === 'string' && backendMessage.trim()) {
        return backendMessage;
      }

      if (error.status === 401) {
        return 'Session expiree. Veuillez vous reconnecter.';
      }

      if (error.status === 413) {
        return 'Le fichier est trop volumineux.';
      }

      if (error.status === 415) {
        return 'Type de fichier non supporte.';
      }
    }

    return 'Impossible de televerser la piece jointe.';
  }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
    } catch {}
  }

  private isNearBottom(): boolean {
    const container = this.messagesContainer?.nativeElement;
    if (!container) {
      return true;
    }

    const threshold = 120;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    return distanceFromBottom <= threshold;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.stopVoiceRecording();
  }
}
