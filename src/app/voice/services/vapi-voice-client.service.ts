import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { VoiceAssistantConfig } from '../models/voice-config.model';

interface VapiRuntime {
  on(event: string, callback: (payload: unknown) => void): void;
  off?(event: string, callback: (payload: unknown) => void): void;
  start(options?: unknown): Promise<void> | void;
  stop(): Promise<void> | void;
}

declare global {
  interface Window {
    Vapi?: new (publicApiKey: string) => VapiRuntime;
  }
}

@Injectable({ providedIn: 'root' })
export class VapiVoiceClient {
  private vapi: VapiRuntime | null = null;
  private initializedKey = '';

  private readonly connectionSubject = new BehaviorSubject<boolean>(false);
  private readonly transcriptSubject = new Subject<string>();
  private readonly messageSubject = new Subject<unknown>();
  private readonly errorSubject = new Subject<string>();

  readonly connected$ = this.connectionSubject.asObservable();
  readonly transcript$ = this.transcriptSubject.asObservable();
  readonly message$ = this.messageSubject.asObservable();
  readonly error$ = this.errorSubject.asObservable();

  async start(config: VoiceAssistantConfig): Promise<void> {
    if (!config.publicApiKey || !config.assistantId) {
      this.errorSubject.next('Vapi configuration missing.');
      return;
    }

    this.ensureClient(config.publicApiKey);
    if (!this.vapi) {
      this.errorSubject.next('Vapi SDK not found on window.Vapi.');
      return;
    }

    try {
      await this.vapi.start({ assistant: config.assistantId });
      this.connectionSubject.next(true);
    } catch {
      this.errorSubject.next('Failed to start Vapi session.');
      this.connectionSubject.next(false);
    }
  }

  async stop(): Promise<void> {
    if (!this.vapi) {
      return;
    }

    try {
      await this.vapi.stop();
    } finally {
      this.connectionSubject.next(false);
    }
  }

  private ensureClient(publicKey: string): void {
    if (this.vapi && this.initializedKey === publicKey) {
      return;
    }

    if (!window.Vapi) {
      this.vapi = null;
      return;
    }

    this.vapi = new window.Vapi(publicKey);
    this.initializedKey = publicKey;

    this.vapi.on('message', (payload) => this.handleMessage(payload));
    this.vapi.on('transcript', (payload) => this.handleTranscript(payload));
    this.vapi.on('error', () => this.errorSubject.next('Vapi runtime error.'));
    this.vapi.on('call-start', () => this.connectionSubject.next(true));
    this.vapi.on('call-end', () => this.connectionSubject.next(false));
  }

  private handleMessage(payload: unknown): void {
    this.messageSubject.next(payload);

    const transcript = this.extractTranscript(payload);
    if (transcript) {
      this.transcriptSubject.next(transcript);
    }
  }

  private handleTranscript(payload: unknown): void {
    const transcript = this.extractTranscript(payload);
    if (transcript) {
      this.transcriptSubject.next(transcript);
    }
  }

  private extractTranscript(payload: unknown): string | null {
    if (typeof payload === 'string') {
      return payload;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const candidate = payload as Record<string, unknown>;
    const maybeText =
      candidate['transcript'] ??
      candidate['text'] ??
      candidate['message'] ??
      candidate['content'];

    return typeof maybeText === 'string' ? maybeText : null;
  }
}
