import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VoiceAgentService } from '../../../services/voice-agent.service';

@Component({
  selector: 'app-ecommerce',
  templateUrl: './ecommerce.component.html',
})
export class EcommerceComponent implements OnInit, OnDestroy {
  isVoiceRunning = false;
  voiceStatus = 'Idle';
  lastVoiceMessage = '';

  private readonly subscription = new Subscription();

  constructor(private readonly voice: VoiceAgentService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.voice.isRunning$.subscribe((running) => {
        this.isVoiceRunning = running;
      }),
    );

    this.subscription.add(
      this.voice.status$.subscribe((status) => {
        this.voiceStatus = status;
      }),
    );

    this.subscription.add(
      this.voice.lastMessage$.subscribe((message) => {
        this.lastVoiceMessage = message;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  async start(): Promise<void> {
    await this.voice.startAgent();
  }

  async stop(): Promise<void> {
    await this.voice.stopAgent();
  }
}
