import { Component, OnDestroy, OnInit } from '@angular/core';
import { VoiceWakeService } from './services/voice-wake.service';
import { LanguageService } from './services/i18n/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Frontend_Medifollow';

  constructor(
    private readonly wake: VoiceWakeService,
    private languageService: LanguageService
  ) {
    this.languageService.initialize();
  }

  ngOnInit(): void {
    this.wake.startListening();
  }

  ngOnDestroy(): void {
    this.wake.stopListening();
  }
}