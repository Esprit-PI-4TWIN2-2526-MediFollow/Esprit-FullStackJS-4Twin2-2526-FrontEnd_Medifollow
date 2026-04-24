import { Component } from '@angular/core';
import { LanguageService } from './services/i18n/language.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Frontend_Medifollow';

  constructor(
    private languageService: LanguageService
  ) {
    this.languageService.initialize();
  }
}
