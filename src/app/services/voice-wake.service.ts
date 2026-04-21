import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ActionDispatcherService } from './action-dispatcher.service';
import { VoiceCommandService } from './voice-command.service';

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

@Injectable({ providedIn: 'root' })
export class VoiceWakeService {
  private recognition: SpeechRecognitionLike | null = null;
  private readonly wakeDetectedSubject = new Subject<string>();

  private isActive = false;
  private isStarting = false;
  private isRecognitionRunning = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private commandInFlight = false;

  private restartAttempts = 0;
  private restartWindowStart = 0;
  private readonly restartWindowMs = 30000;
  private readonly maxRestartsPerWindow = 18;
  private readonly baseRestartDelayMs = 400;
  private readonly maxRestartDelayMs = 6000;
  private readonly cooldownMs = 12000;

  private lastWakeTriggerAt = 0;
  private readonly wakeDebounceMs = 2200;
  private assistantActiveUntil = 0;
  private readonly assistantActiveMs = 10000;

  private noSpeechCount = 0;
  private readonly primaryLanguage = 'en-US';
  private currentLanguage = this.primaryLanguage;

  private readonly wakePatterns = [
    /\bhey\s+skander\b/i,
    /\bhi\s+skander\b/i,
    /\bskander\b/i,
    /\bscander\b/i,
    /\bskandar\b/i,
  ];

  readonly wakeDetected$: Observable<string> = this.wakeDetectedSubject.asObservable();

  constructor(
    private readonly voiceCommandService: VoiceCommandService,
    private readonly actionDispatcher: ActionDispatcherService,
  ) {}

  async startListening(language: 'en-US' = 'en-US'): Promise<void> {
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
    this.assistantActiveUntil = 0;

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
    this.assistantActiveUntil = 0;
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

  private bindRecognitionHandlers(recognition: SpeechRecognitionLike): void {
    recognition.onstart = () => {
      this.isStarting = false;
      this.isRecognitionRunning = true;
      this.restartAttempts = 0;
      console.log('[VoiceWake] Listening started');
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const raw = event.results[i]?.[0]?.transcript ?? '';
        const normalized = this.normalizeTranscript(raw);
        if (!this.isValidTranscript(normalized)) {
          continue;
        }

        console.log(`[VoiceWake] Transcript: "${normalized}"`);
        const isFinal = !!event.results[i]?.isFinal;

        if (!isFinal) {
          continue;
        }

        void this.handleTranscript(normalized);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      const errorType = event?.error ?? 'unknown';
      console.error(`[VoiceWake] Recognition error: ${errorType}`);
      this.isStarting = false;
      this.isRecognitionRunning = false;

      if (errorType === 'no-speech') {
        this.noSpeechCount += 1;
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

  private async handleTranscript(transcript: string): Promise<void> {
    if (this.commandInFlight) {
      return;
    }

    const wakeFound = this.containsWakeWord(transcript);
    let commandText = transcript;

    if (wakeFound && this.canTriggerWake()) {
      this.lastWakeTriggerAt = Date.now();
      this.assistantActiveUntil = Date.now() + this.assistantActiveMs;
      this.wakeDetectedSubject.next(transcript);
      this.speak('Yes, how can I help you?');
      commandText = this.removeWakeWord(transcript);
    } else if (!wakeFound && !this.isAssistantActive()) {
      return;
    }

    if (!commandText.trim()) {
      return;
    }

    this.commandInFlight = true;
    try {
      const intent = await this.voiceCommandService.processCommand(commandText);
      await this.actionDispatcher.dispatch(intent);
    } catch (error) {
      console.error('[VoiceWake] Command pipeline failed', error);
      this.speak('Sorry, I could not process that.');
    } finally {
      this.commandInFlight = false;
    }
  }

  private containsWakeWord(transcript: string): boolean {
    return this.wakePatterns.some((pattern) => pattern.test(transcript));
  }

  private removeWakeWord(transcript: string): string {
    let result = transcript;
    for (const pattern of this.wakePatterns) {
      result = result.replace(pattern, ' ');
    }
    return result.replace(/\s+/g, ' ').trim();
  }

  private isAssistantActive(): boolean {
    return Date.now() < this.assistantActiveUntil;
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
    if (!value || value.length < 3) {
      return false;
    }
    return /[a-z]/i.test(value);
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

    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    const englishVoice =
      voices.find((voice) => voice.lang.toLowerCase().includes('en-us')) ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    synth.cancel();
    synth.speak(utterance);
  }
}
