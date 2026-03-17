import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SpeechResult {
  transcript: string;
  isFinal: boolean;
}

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private recognition: any;
  private currentSubject: Subject<SpeechResult> | null = null; // ← plus de subject global

  isListening = false;
  readonly isSupported =
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  constructor(private ngZone: NgZone) {
    if (!this.isSupported) return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SR();
    this.recognition.continuous     = false;
    this.recognition.interimResults = true;
    this.recognition.lang           = 'fr-FR';

    this.recognition.onresult = (event: any) => {
      this.ngZone.run(() => {
        const r = event.results[event.results.length - 1];
        // émet uniquement sur le subject du champ actif
        this.currentSubject?.next({
          transcript: r[0].transcript.trim(),
          isFinal:    r.isFinal,
        });
      });
    };

    this.recognition.onend = () => {
      this.ngZone.run(() => {
        this.isListening = false;
        this.currentSubject?.complete(); // ← ferme l'observable du champ
        this.currentSubject = null;
      });
    };

    this.recognition.onerror = () => {
      this.ngZone.run(() => {
        this.isListening = false;
        this.currentSubject?.complete();
        this.currentSubject = null;
      });
    };
  }

  start(lang = 'fr-FR'): Observable<SpeechResult> {
    // Si un autre champ écoute déjà, on l'arrête proprement
    if (this.isListening) {
      this.stop();
    }

    // Nouveau subject isolé pour ce champ
    this.currentSubject = new Subject<SpeechResult>();

    this.recognition.lang = lang;
    this.recognition.start();
    this.isListening = true;

    return this.currentSubject.asObservable(); // ← observable unique par appel
  }

  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}
