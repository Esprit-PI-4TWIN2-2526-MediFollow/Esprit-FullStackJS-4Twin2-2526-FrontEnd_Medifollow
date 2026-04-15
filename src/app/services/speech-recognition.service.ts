import { Injectable, NgZone } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface SpeechResult {
  transcript: string; // le texte reconnu
  isFinal: boolean; // true = résultat définitif, false = résultat intermédiaire
}

@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private recognition: any; // l'objet natif du navigateur
  private currentSubject: Subject<SpeechResult> | null = null; // ← plus de subject global

  isListening = false;
  readonly isSupported =
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window; // vérifie si le navigateur supporte l'API

  constructor(private ngZone: NgZone) {
    if (!this.isSupported) return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    this.recognition = new SR();
    this.recognition.continuous     = false; // s'arrête après une pause
    this.recognition.interimResults = true;  // émet aussi les résultats partiels
    this.recognition.lang           = 'fr-FR';

    //onresult: Reçoit le texte reconnu et l'envoie dans le Subject actif
    this.recognition.onresult = (event: any) => {
      this.ngZone.run(() => { // pour éviter les problèmes de détection de changement
        const r = event.results[event.results.length - 1];
        // émet uniquement sur le subject du champ actif
        this.currentSubject?.next({
          transcript: r[0].transcript.trim(),
          isFinal:    r.isFinal,
        });
      });
    };

//Marque la fin de l'écoute, complète et détruit le Subject
    this.recognition.onend = () => {
      this.ngZone.run(() => {
        this.isListening = false;
        this.currentSubject?.complete(); // ← ferme l'observable du champ
        this.currentSubject = null;
      });
    };
//Même comportement qu'onend en cas d'erreur
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
      this.stop();  // arrête le champ précédent proprement
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
