import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable, Subject } from 'rxjs';

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | string;

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence?: number;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: SpeechRecognitionErrorCode;
  message?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface VoiceSessionResponse {
  token?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class VoiceWakeService {
  private recognition: SpeechRecognitionLike | null = null;
  private readonly wakeDetectedSubject = new Subject<string>();
  private readonly sessionStartedSubject = new Subject<VoiceSessionResponse>();

  private isActive = false;
  private isStarting = false;
  private isRecognitionRunning = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;

  private isSessionCallInFlight = false;
  private isVoiceSessionActive = false;
  private lastSessionStartAt = 0;
  private readonly sessionCooldownMs = 2800;
  private sessionResponse: VoiceSessionResponse | null = null;

  private restartAttempts = 0;
  private restartWindowStart = 0;
  private readonly restartWindowMs = 30000;
  private readonly maxRestartsPerWindow = 18;
  private readonly baseRestartDelayMs = 400;
  private readonly maxRestartDelayMs = 6000;
  private readonly cooldownMs = 12000;

  private lastWakeTriggerAt = 0;
  private readonly wakeDebounceMs = 2200;

  private noSpeechCount = 0;
  private readonly noSpeechFallbackThreshold = 5;
  private readonly primaryLanguage = 'en-US';
  private readonly fallbackLanguage = 'fr-FR';
  private currentLanguage = this.primaryLanguage;

  private readonly wakePatterns = [
    /\bskander\b/i,
    /\bhey\s+skander\b/i,
    /\bhi\s+skander\b/i,
    /\bskandar\b/i,
  ];

  readonly wakeDetected$: Observable<string> = this.wakeDetectedSubject.asObservable();
  readonly sessionStarted$: Observable<VoiceSessionResponse> =
    this.sessionStartedSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  async startListening(language: 'en-US' | 'fr-FR' = 'en-US'): Promise<void> {
    const ctor = this.getSpeechRecognitionCtor();
    if (!ctor) {
      console.error('[VoiceWake] SpeechRecognition API is not supported.');
      return;
    }

    if (this.isActive) {
      return;
    }

    const hasMic = await this.verifyMicrophoneAccess();
    if (!hasMic) {
      console.error('[VoiceWake] Microphone permission denied or unavailable.');
      return;
    }

    this.isActive = true;
    this.currentLanguage = language;
    this.noSpeechCount = 0;
    this.restartAttempts = 0;
    this.restartWindowStart = Date.now();

    if (!this.recognition) {
      this.recognition = new ctor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 3;
      this.bindRecognitionHandlers(this.recognition);
    }

    this.applyLanguage();
    this.safeStartRecognition('initial-start');
  }

  stopListening(): void {
    this.isActive = false;
    this.isStarting = false;
    this.clearRestartTimer();

    if (!this.recognition) {
      return;
    }

    try {
      this.recognition.stop();
    } catch {
      // ignore
    }
  }

  onWakeWordDetected(): Observable<string> {
    return this.wakeDetected$;
  }

  onSessionStarted(): Observable<VoiceSessionResponse> {
    return this.sessionStarted$;
  }

  async startVoiceSession(): Promise<VoiceSessionResponse | null> {
    const now = Date.now();

    if (this.isSessionCallInFlight) {
      return this.sessionResponse;
    }

    if (this.isVoiceSessionActive && now - this.lastSessionStartAt < this.sessionCooldownMs) {
      return this.sessionResponse;
    }

    if (now - this.lastSessionStartAt < this.sessionCooldownMs) {
      return this.sessionResponse;
    }

    this.isSessionCallInFlight = true;
    this.lastSessionStartAt = now;

    console.log('[VoiceWake] Calling backend...');

    try {
      const session = await firstValueFrom(
        this.http.post<VoiceSessionResponse>('http://localhost:3000/voice/session', {}),
      );

      this.sessionResponse = session;
      this.isVoiceSessionActive = true;
      this.sessionStartedSubject.next(session);
      this.speak('Yes, how can I help you?');
      console.log('[VoiceWake] Session started');
      return session;
    } catch (error) {
      this.isVoiceSessionActive = false;
      console.error('[VoiceWake] Failed to start session', error);
      return null;
    } finally {
      this.isSessionCallInFlight = false;
    }
  }

  private bindRecognitionHandlers(recognition: SpeechRecognitionLike): void {
    recognition.onstart = () => {
      this.isStarting = false;
      this.isRecognitionRunning = true;
      this.restartAttempts = 0;
      console.log('[VoiceWake] Listening started');
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let transcript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const alt = event.results[i]?.[0]?.transcript ?? '';
        transcript += `${alt} `;
      }

      const normalized = this.normalizeTranscript(transcript);
      if (!this.isValidTranscript(normalized)) {
        return;
      }

      console.log(`[VoiceWake] Transcript: "${normalized}"`);

      if (this.isWakePhrase(normalized) && this.canTriggerWake()) {
        this.lastWakeTriggerAt = Date.now();
        console.log('[VoiceWake] Skander activated');
        this.wakeDetectedSubject.next(normalized);
        void this.startVoiceSession();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const errorType = event?.error ?? 'unknown';
      console.error(`[VoiceWake] Recognition error: ${errorType}`);
      this.isStarting = false;
      this.isRecognitionRunning = false;

      if (errorType === 'no-speech') {
        this.noSpeechCount += 1;
        if (
          this.noSpeechCount >= this.noSpeechFallbackThreshold &&
          this.currentLanguage !== this.fallbackLanguage
        ) {
          this.currentLanguage = this.fallbackLanguage;
          this.applyLanguage();
        }
      } else if (errorType === 'audio-capture' || errorType === 'network') {
        this.noSpeechCount = 0;
      }

      if (
        errorType === 'no-speech' ||
        errorType === 'audio-capture' ||
        errorType === 'network'
      ) {
        this.scheduleRestart(`error:${errorType}`);
      }
    };

    recognition.onend = () => {
      this.isStarting = false;
      this.isRecognitionRunning = false;
      if (!this.isActive) {
        return;
      }
      console.log('[VoiceWake] Recognition ended, restarting...');
      this.scheduleRestart('onend');
    };
  }

  private scheduleRestart(reason: string): void {
    if (!this.isActive) {
      return;
    }

    this.clearRestartTimer();

    const now = Date.now();
    if (now - this.restartWindowStart > this.restartWindowMs) {
      this.restartWindowStart = now;
      this.restartAttempts = 0;
    }

    this.restartAttempts += 1;

    if (this.restartAttempts > this.maxRestartsPerWindow) {
      console.warn(`[VoiceWake] Restart throttled (${reason}), cooldown ${this.cooldownMs}ms`);
      this.restartAttempts = 0;
      this.restartWindowStart = Date.now();
      this.restartTimer = setTimeout(() => {
        this.safeStartRecognition('throttled-restart');
      }, this.cooldownMs);
      return;
    }

    const delay = Math.min(
      this.baseRestartDelayMs * Math.max(1, Math.floor(this.restartAttempts / 2)),
      this.maxRestartDelayMs,
    );

    this.restartTimer = setTimeout(() => {
      this.safeStartRecognition(`restart:${reason}`);
    }, delay);
  }

  private safeStartRecognition(context: string): void {
    if (!this.isActive || !this.recognition) {
      return;
    }

    if (this.isRecognitionRunning || this.isStarting) {
      return;
    }

    try {
      this.isStarting = true;
      this.applyLanguage();
      this.recognition.start();
    } catch (error) {
      this.isStarting = false;
      console.error(`[VoiceWake] Start failed (${context})`, error);
      this.scheduleRestart(`start-failed:${context}`);
    }
  }

  private applyLanguage(): void {
    if (!this.recognition) {
      return;
    }
    this.recognition.lang = this.currentLanguage;
  }

  private normalizeTranscript(value: string): string {
    return value
      .toLowerCase()
      .replace(/[.,!?;:()[\]{}"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isValidTranscript(value: string): boolean {
    if (!value) {
      return false;
    }
    if (value.length < 3) {
      return false;
    }
    return /[a-z]/i.test(value);
  }

  private isWakePhrase(transcript: string): boolean {
    return this.wakePatterns.some((pattern) => pattern.test(transcript));
  }

  private canTriggerWake(): boolean {
    return Date.now() - this.lastWakeTriggerAt > this.wakeDebounceMs;
  }

  private clearRestartTimer(): void {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
  }

  private getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
    const win = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
  }

  private async verifyMicrophoneAccess(): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  private speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
