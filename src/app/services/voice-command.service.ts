import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface VoiceIntentResponse {
  intent?: string;
  action?: string;
  target?: string;
  route?: string;
  field?: string;
  value?: string | number | boolean | null;
  message?: string;
  [key: string]: unknown;
}

interface VoiceIntentPayload {
  text: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceCommandService {
  private readonly intentUrl = 'http://localhost:3000/voice/intent';

  constructor(private readonly http: HttpClient) {}

  async processCommand(text: string): Promise<VoiceIntentResponse | null> {
    const cleanText = text.trim();
    if (!cleanText) {
      return null;
    }

    const payload: VoiceIntentPayload = {
      text: cleanText,
      role: this.getCurrentUserRole(),
    };

    try {
      return await firstValueFrom(
        this.http.post<VoiceIntentResponse>(this.intentUrl, payload),
      );
    } catch (error) {
      console.error('[VoiceCommand] Backend intent call failed', error);
      return null;
    }
  }

  private getCurrentUserRole(): string {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        return 'UNKNOWN';
      }

      const user = JSON.parse(rawUser) as {
        role?: string | { name?: string };
      };

      if (typeof user.role === 'string' && user.role.trim()) {
        return user.role.trim();
      }

      if (
        user.role &&
        typeof user.role === 'object' &&
        typeof user.role.name === 'string' &&
        user.role.name.trim()
      ) {
        return user.role.name.trim();
      }

      return 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }
}
