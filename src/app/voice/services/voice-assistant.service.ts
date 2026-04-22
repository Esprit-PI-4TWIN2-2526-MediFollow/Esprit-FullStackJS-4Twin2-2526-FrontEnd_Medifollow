import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subscription, filter, interval } from 'rxjs';
import {
  VoiceCommandPayload,
  VoiceExecutionResult,
} from '../models/voice-command.model';
import {
  DEFAULT_VOICE_ASSISTANT_CONFIG,
  VoiceAssistantConfig,
} from '../models/voice-config.model';
import { VoiceUiState } from '../models/voice-ui.model';
import { VoiceCommandRouterService } from './voice-command-router.service';
import { VoiceContextService } from './voice-context.service';
import { VapiVoiceClient } from './vapi-voice-client.service';

@Injectable({ providedIn: 'root' })
export class VoiceAssistantService implements OnDestroy {
  private config: VoiceAssistantConfig = { ...DEFAULT_VOICE_ASSISTANT_CONFIG };
  private activatedUntil = 0;
  private readonly subscriptions = new Subscription();

  private readonly uiStateSubject = new BehaviorSubject<VoiceUiState>({
    status: 'idle',
    listening: false,
    activated: false,
    message: 'Say Skander to activate',
    lastHeard: '',
  });

  readonly uiState$ = this.uiStateSubject.asObservable();

  constructor(
    private readonly vapiClient: VapiVoiceClient,
    private readonly commandRouter: VoiceCommandRouterService,
    private readonly context: VoiceContextService,
    private readonly router: Router,
  ) {
    this.configureFromRuntime();

    this.subscriptions.add(
      this.vapiClient.connected$.subscribe((connected) => {
        this.patchUi({
          status: connected ? 'listening' : 'idle',
          listening: connected,
          message: connected ? 'Listening for Skander' : 'Voice assistant paused',
        });
      }),
    );

    this.subscriptions.add(
      this.vapiClient.transcript$.subscribe((transcript) => {
        void this.handleTranscript(transcript);
      }),
    );

    this.subscriptions.add(
      this.vapiClient.message$.subscribe((payload) => {
        void this.handleRawMessage(payload);
      }),
    );

    this.subscriptions.add(
      this.vapiClient.error$.subscribe((message) => {
        this.patchUi({ status: 'error', message });
      }),
    );

    this.subscriptions.add(
      interval(300).subscribe(() => {
        const active = Date.now() < this.activatedUntil;
        if (active !== this.uiStateSubject.value.activated) {
          this.patchUi({ activated: active });
        }
      }),
    );

    this.subscriptions.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => this.context.setCurrentPage(event.urlAfterRedirects)),
    );

    this.context.setCurrentPage(this.router.url);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  configure(config: Partial<VoiceAssistantConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async start(): Promise<void> {
    this.patchUi({ status: 'processing', message: 'Starting voice assistant...' });
    await this.vapiClient.start(this.config);
  }

  async stop(): Promise<void> {
    await this.vapiClient.stop();
    this.activatedUntil = 0;
    this.patchUi({
      status: 'idle',
      listening: false,
      activated: false,
      message: 'Voice assistant stopped',
    });
  }

  async processCommand(command: VoiceCommandPayload): Promise<VoiceExecutionResult> {
    this.patchUi({ status: 'processing' });

    const result = await this.commandRouter.execute(command);
    if (result.speech) {
      this.speak(result.speech);
      this.patchUi({ message: result.speech });
    }

    if (this.uiStateSubject.value.listening) {
      this.patchUi({ status: 'listening' });
    }

    return result;
  }

  private async handleTranscript(transcript: string): Promise<void> {
    const cleanTranscript = transcript.trim();
    if (!cleanTranscript) {
      return;
    }

    this.patchUi({ lastHeard: cleanTranscript });

    if (this.containsWakeWord(cleanTranscript)) {
      this.activateWakeWindow();
      return;
    }

    if (!this.uiStateSubject.value.activated) {
      return;
    }

    const command = this.parseTranscriptToCommand(cleanTranscript);
    if (!command) {
      return;
    }

    await this.processCommand(command);
  }

  private async handleRawMessage(payload: unknown): Promise<void> {
    const command = this.extractCommandFromPayload(payload);
    if (!command) {
      return;
    }

    if (command.intent === 'wake') {
      this.activateWakeWindow();
      return;
    }

    const canBypassWake = command.intent === 'confirm' || command.intent === 'cancel';
    if (!canBypassWake && !this.uiStateSubject.value.activated) {
      return;
    }

    await this.processCommand(command);
  }

  private containsWakeWord(text: string): boolean {
    return text.toLowerCase().includes(this.config.wakeWord.toLowerCase());
  }

  private activateWakeWindow(): void {
    this.activatedUntil = Date.now() + this.config.activeWindowMs;
    this.patchUi({
      activated: true,
      message: 'Yes, how can I help you?',
    });
    this.speak('Yes, how can I help you?');
  }

  private extractCommandFromPayload(payload: unknown): VoiceCommandPayload | null {
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload) as unknown;
        return this.extractCommandFromPayload(parsed);
      } catch {
        return null;
      }
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const maybeCommand = this.findCommandNode(payload);
    if (!maybeCommand) {
      return null;
    }

    return this.normalizeCommand(maybeCommand);
  }

  private findCommandNode(payload: unknown): Record<string, unknown> | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const objectPayload = payload as Record<string, unknown>;
    if (typeof objectPayload['intent'] === 'string') {
      return objectPayload;
    }

    for (const value of Object.values(objectPayload)) {
      if (value && typeof value === 'object') {
        const nested = this.findCommandNode(value);
        if (nested) {
          return nested;
        }
      }
    }

    return null;
  }

  private normalizeCommand(node: Record<string, unknown>): VoiceCommandPayload {
    const intentValue = String(node['intent'] ?? 'unknown').toLowerCase();

    return {
      intent: this.normalizeIntent(intentValue),
      field: this.toOptionalString(node['field']),
      target: this.toOptionalString(node['target']),
      value: this.normalizeValue(node['value']),
      rawText: this.toOptionalString(node['rawText']),
    };
  }

  private parseTranscriptToCommand(text: string): VoiceCommandPayload | null {
    const cleaned = text.trim();
    const lower = cleaned.toLowerCase();

    if (lower === 'confirm' || lower.includes('yes confirm')) {
      return { intent: 'confirm', rawText: cleaned };
    }

    if (lower === 'cancel' || lower.includes('never mind')) {
      return { intent: 'cancel', rawText: cleaned };
    }

    if (lower.includes('next')) {
      return { intent: 'next', rawText: cleaned };
    }

    if (lower.includes('previous') || lower.includes('back')) {
      return { intent: 'previous', rawText: cleaned };
    }

    if (lower.includes('submit')) {
      return { intent: 'submit', rawText: cleaned };
    }

    if (lower.includes('delete')) {
      return { intent: 'delete', rawText: cleaned };
    }

    const navigateMatch = lower.match(/(?:go to|navigate to|open)\s+([a-z0-9\-_/]+)/i);
    if (navigateMatch?.[1]) {
      return { intent: 'navigate', target: navigateMatch[1], rawText: cleaned };
    }

    const fillMatch = cleaned.match(
      /(?:fill|set|update)\s+(?:field\s+)?([a-zA-Z0-9_-]+)\s+(?:to\s+)?(.+)/i,
    );

    if (fillMatch?.[1] && fillMatch[2]) {
      return {
        intent: 'fill_field',
        field: fillMatch[1],
        value: this.parsePrimitive(fillMatch[2]),
        rawText: cleaned,
      };
    }

    return null;
  }

  private normalizeIntent(rawIntent: string): VoiceCommandPayload['intent'] {
    const intents: VoiceCommandPayload['intent'][] = [
      'wake',
      'fill_field',
      'navigate',
      'next',
      'previous',
      'submit',
      'delete',
      'confirm',
      'cancel',
      'unknown',
    ];

    return intents.includes(rawIntent as VoiceCommandPayload['intent'])
      ? (rawIntent as VoiceCommandPayload['intent'])
      : 'unknown';
  }

  private parsePrimitive(value: string): string | number | boolean {
    const trimmed = value.trim();

    if (/^(true|false)$/i.test(trimmed)) {
      return trimmed.toLowerCase() === 'true';
    }

    const numberValue = Number(trimmed);
    if (!Number.isNaN(numberValue) && trimmed !== '') {
      return numberValue;
    }

    return trimmed;
  }

  private normalizeValue(value: unknown): string | number | boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return this.parsePrimitive(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return String(value);
  }

  private toOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private speak(text: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => this.patchUi({ status: 'speaking' });
    utterance.onend = () => {
      if (this.uiStateSubject.value.listening) {
        this.patchUi({ status: 'listening' });
      } else {
        this.patchUi({ status: 'idle' });
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  private configureFromRuntime(): void {
    const runtimeConfig = this.readRuntimeConfig();
    this.configure(runtimeConfig);
  }

  private readRuntimeConfig(): Partial<VoiceAssistantConfig> {
    const runtime = (window as Window & { __MEDIFOLLOW_VOICE__?: Partial<VoiceAssistantConfig> })
      .__MEDIFOLLOW_VOICE__;

    return {
      wakeWord: runtime?.wakeWord ?? DEFAULT_VOICE_ASSISTANT_CONFIG.wakeWord,
      assistantId:
        runtime?.assistantId ??
        localStorage.getItem('MEDIFOLLOW_VAPI_ASSISTANT_ID') ??
        DEFAULT_VOICE_ASSISTANT_CONFIG.assistantId,
      publicApiKey:
        runtime?.publicApiKey ??
        localStorage.getItem('MEDIFOLLOW_VAPI_PUBLIC_KEY') ??
        DEFAULT_VOICE_ASSISTANT_CONFIG.publicApiKey,
      activeWindowMs: runtime?.activeWindowMs ?? DEFAULT_VOICE_ASSISTANT_CONFIG.activeWindowMs,
    };
  }

  private patchUi(patch: Partial<VoiceUiState>): void {
    this.uiStateSubject.next({ ...this.uiStateSubject.value, ...patch });
  }
}
