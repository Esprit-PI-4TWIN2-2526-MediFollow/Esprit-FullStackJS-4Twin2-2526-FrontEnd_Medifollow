import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VoiceUiState } from '../../models/voice-ui.model';
import { VoiceAssistantService } from '../../services/voice-assistant.service';

@Component({
  selector: 'app-voice-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-assistant.component.html',
  styleUrl: './voice-assistant.component.css',
})
export class VoiceAssistantComponent implements OnInit, OnDestroy {
  @Input() autoStart = true;

  state: VoiceUiState = {
    status: 'idle',
    listening: false,
    activated: false,
    message: 'Say Skander to activate',
    lastHeard: '',
  };

  private readonly subscriptions = new Subscription();

  constructor(private readonly assistant: VoiceAssistantService) {}

  async ngOnInit(): Promise<void> {
    this.subscriptions.add(
      this.assistant.uiState$.subscribe((state) => {
        this.state = state;
      }),
    );

    if (this.autoStart) {
      await this.assistant.start();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  async onToggleListening(): Promise<void> {
    if (this.state.listening) {
      await this.assistant.stop();
      return;
    }

    await this.assistant.start();
  }
}
