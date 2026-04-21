import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { VoiceIntentResponse } from './voice-command.service';

@Injectable({ providedIn: 'root' })
export class ActionDispatcherService {
  private readonly patientsApiUrl = 'http://localhost:3000/patients';

  private readonly patientsSubject = new BehaviorSubject<unknown[]>([]);
  readonly patients$ = this.patientsSubject.asObservable();

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient,
  ) {}

  async dispatch(intentResponse: VoiceIntentResponse | null): Promise<void> {
    if (!intentResponse) {
      this.speak('I could not process your request.');
      return;
    }

    const intent = this.normalizeIntent(intentResponse);

    switch (intent) {
      case 'NAVIGATE':
        await this.handleNavigate(intentResponse);
        return;
      case 'FILL_FIELD':
        this.handleFillField(intentResponse);
        return;
      case 'SUBMIT_FORM':
        this.handleSubmitForm();
        return;
      case 'GET_PATIENTS':
        await this.handleGetPatients();
        return;
      default:
        this.speak('Unknown command.');
    }
  }

  private async handleNavigate(intentResponse: VoiceIntentResponse): Promise<void> {
    const rawTarget = String(
      intentResponse.target ?? intentResponse.route ?? intentResponse['path'] ?? '',
    ).trim();

    if (!rawTarget) {
      this.speak('Navigation target is missing.');
      return;
    }

    const aliasMap: Record<string, string> = {
      dashboard: '/dashboard',
      home: '/dashboard',
      ecommerce: '/dashboard',
      profile: '/profile',
      notifications: '/notifications',
    };

    const normalized = rawTarget.toLowerCase();
    const destination =
      aliasMap[normalized] ?? (rawTarget.startsWith('/') ? rawTarget : `/${rawTarget}`);

    try {
      await this.router.navigateByUrl(destination);
      this.speak(`Navigating to ${normalized}`);
    } catch {
      this.speak('Navigation failed.');
    }
  }

  private handleFillField(intentResponse: VoiceIntentResponse): void {
    const rawField = String(intentResponse.field ?? '').trim().toLowerCase();
    const value = intentResponse.value;

    if (!rawField) {
      this.speak('Field name is missing.');
      return;
    }

    const selectorMap: Record<string, string> = {
      temperature: "input[name='temperature']",
      heart_rate: "input[name='heartRate']",
      blood_pressure: "textarea[name='bloodPressure']",
      oxygen: "input[name='oxygen']",
    };

    const selector = selectorMap[rawField];
    if (!selector) {
      this.speak('Unsupported field.');
      return;
    }

    const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    if (!element) {
      this.speak('Field not found on this page.');
      return;
    }

    const nextValue = value === null || value === undefined ? '' : String(value);
    element.focus();
    element.value = nextValue;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    const spokenField =
      rawField === 'heart_rate'
        ? 'Heart rate'
        : rawField === 'blood_pressure'
          ? 'Blood pressure'
          : rawField.charAt(0).toUpperCase() + rawField.slice(1);
    this.speak(`${spokenField} recorded`);
  }

  private handleSubmitForm(): void {
    const activeElement = document.activeElement as HTMLElement | null;
    const activeForm = activeElement?.closest('form');
    const fallbackForm = document.querySelector<HTMLFormElement>('form');
    const form = activeForm ?? fallbackForm;

    if (!form) {
      this.speak('No form found to submit.');
      return;
    }

    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
      this.speak('Form submitted');
      return;
    }

    const submitButton = form.querySelector<HTMLButtonElement>(
      "button[type='submit'], input[type='submit']",
    );

    if (submitButton) {
      submitButton.click();
      this.speak('Form submitted');
      return;
    }

    this.speak('Submit action is unavailable.');
  }

  private async handleGetPatients(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<unknown>(this.patientsApiUrl));
      const patients = this.extractPatients(response);
      this.patientsSubject.next(patients);
      window.dispatchEvent(new CustomEvent('voice-patients', { detail: patients }));
      this.speak(`Found ${patients.length} patients`);
    } catch (error) {
      console.error('[ActionDispatcher] Failed to fetch patients', error);
      this.speak('Could not retrieve patients.');
    }
  }

  private extractPatients(value: unknown): unknown[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (Array.isArray(record['patients'])) {
        return record['patients'];
      }
      if (Array.isArray(record['data'])) {
        return record['data'];
      }
      if (Array.isArray(record['results'])) {
        return record['results'];
      }
    }

    return [];
  }

  private normalizeIntent(intentResponse: VoiceIntentResponse): string {
    const rawIntent = String(intentResponse.intent ?? intentResponse.action ?? '').trim();
    return rawIntent.toUpperCase().replace(/[-\s]+/g, '_');
  }

  private speak(message: string): void {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
