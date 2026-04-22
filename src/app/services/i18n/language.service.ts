import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly storageKey = 'app_language';
  readonly supportedLanguages = ['fr', 'en'] as const;

  constructor(private translate: TranslateService) {}

  initialize(): void {
    this.translate.addLangs([...this.supportedLanguages]);
    this.translate.setDefaultLang('fr');

    const savedLanguage = localStorage.getItem(this.storageKey);
    const browserLanguage = this.translate.getBrowserLang();
    const initialLanguage = this.isSupported(savedLanguage)
      ? savedLanguage
      : this.isSupported(browserLanguage)
        ? browserLanguage
        : 'fr';

    this.use(initialLanguage);
  }

  use(language: string): void {
    const nextLanguage = this.isSupported(language) ? language : 'fr';
    this.translate.use(nextLanguage);
    localStorage.setItem(this.storageKey, nextLanguage);
  }

  get currentLanguage(): string {
    return this.translate.currentLang || this.translate.defaultLang || 'fr';
  }

  private isSupported(language: string | null | undefined): language is 'fr' | 'en' {
    return !!language && this.supportedLanguages.includes(language as 'fr' | 'en');
  }
}
