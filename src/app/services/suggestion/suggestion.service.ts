// src/app/services/suggestions.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from './environment';

export interface ValidationSuggestions {
  responseId: string;
  suggestions: string[];
  timestamp: Date;
}

export interface RealTimeSuggestions {
  responseId: string;
  partialNote: string;
  suggestions: { completions: string[]; medicalTerms: string[] };
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class SuggestionsService implements OnDestroy {
  private socket: Socket | null = null;
  private validationSuggestions$ = new Subject<ValidationSuggestions>();
  private realTimeSuggestions$ = new Subject<RealTimeSuggestions>();
  private error$ = new Subject<{ message: string }>();

  connect(userId: string, department: string): void {
    if (this.socket?.connected) return;

    this.socket = io(`${environment.apiUrl}/suggestions`, {
      auth: { userId, department },
      transports: ['websocket'],
    });

    this.socket.on('validation-suggestions', (data: ValidationSuggestions) => {
      this.validationSuggestions$.next(data);
    });

    this.socket.on('real-time-suggestions', (data: RealTimeSuggestions) => {
      this.realTimeSuggestions$.next(data);
    });

    this.socket.on('error', (err: { message: string }) => {
      this.error$.next(err);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  getValidationSuggestions(responseId: string, patientContext?: string): void {
    this.socket?.emit('get-validation-suggestions', { responseId, patientContext });
  }

  getRealTimeSuggestions(partialNote: string, responseId: string): void {
    this.socket?.emit('get-real-time-suggestions', { partialNote, responseId });
  }

  onValidationSuggestions(): Observable<ValidationSuggestions> {
    return this.validationSuggestions$.asObservable();
  }

  onRealTimeSuggestions(): Observable<RealTimeSuggestions> {
    return this.realTimeSuggestions$.asObservable();
  }

  onError(): Observable<{ message: string }> {
    return this.error$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
