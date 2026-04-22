import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import Vapi from '@vapi-ai/web';

interface VoiceSessionResponse {
  token: string;
  assistant?: unknown;
}

@Injectable({ providedIn: 'root' })
export class VoiceAgentService {
  private vapi: Vapi | null = null;
  private skanderActivated = false;

  private readonly isRunningSubject = new BehaviorSubject<boolean>(false);
  private readonly statusSubject = new BehaviorSubject<string>('Idle');
  private readonly lastMessageSubject = new BehaviorSubject<string>('');

  readonly isRunning$ = this.isRunningSubject.asObservable();
  readonly status$ = this.statusSubject.asObservable();
  readonly lastMessage$ = this.lastMessageSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  async getSession(): Promise<VoiceSessionResponse> {
    return firstValueFrom(
      this.http.post<VoiceSessionResponse>('http://localhost:3000/voice/session', {}),
    );
  }

  async startAgent(): Promise<void> {
    if (this.vapi) {
      this.statusSubject.next('Skander is already running');
      return;
    }

    this.statusSubject.next('Requesting secure session...');
    const session = await this.getSession();
    this.vapi = new Vapi(session.token);
    this.bindEvents();

    this.statusSubject.next('Starting microphone...');
    if (session.assistant) {
      await this.vapi.start(session.assistant);
    } else {
      await this.vapi.start();
    }

    this.isRunningSubject.next(true);
    this.statusSubject.next('Skander is ready. Say "Skander" to activate commands.');
  }

  async stopAgent(): Promise<void> {
    if (!this.vapi) {
      this.statusSubject.next('Skander is not running');
      return;
    }

    await this.vapi.stop();
    this.vapi = null;
    this.skanderActivated = false;
    this.isRunningSubject.next(false);
    this.statusSubject.next('Skander stopped');
  }

  private bindEvents(): void {
    if (!this.vapi) {
      return;
    }

    this.vapi.on('speech-start', () => {
      this.statusSubject.next('Listening...');
    });

    this.vapi.on('speech-end', () => {
      this.statusSubject.next('Processing...');
    });

    this.vapi.on('message', (msg: unknown) => {
      const text = this.extractText(msg);
      if (text) {
        this.lastMessageSubject.next(text);
        this.handleWakeWord(text);
      }
      console.log('Skander:', msg);
    });

    this.vapi.on('error', (error: unknown) => {
      console.error('Vapi error:', error);
      this.statusSubject.next('Voice agent error');
    });

    this.vapi.on('call-end', () => {
      this.vapi = null;
      this.skanderActivated = false;
      this.isRunningSubject.next(false);
      this.statusSubject.next('Skander disconnected');
    });
  }

  private handleWakeWord(transcript: string): void {
    if (transcript.toLowerCase().includes('skander')) {
      this.skanderActivated = true;
      this.statusSubject.next('Wake word detected. Commands enabled.');
    }
  }

  private extractText(message: unknown): string {
    if (!message || typeof message !== 'object') {
      return '';
    }

    const data = message as Record<string, unknown>;
    const direct =
      data['transcript'] ??
      data['text'] ??
      data['message'] ??
      data['content'];

    if (typeof direct === 'string') {
      return direct;
    }

    const nested = data['transcript'] as Record<string, unknown> | undefined;
    if (nested && typeof nested['text'] === 'string') {
      return nested['text'];
    }

    return '';
  }
}
