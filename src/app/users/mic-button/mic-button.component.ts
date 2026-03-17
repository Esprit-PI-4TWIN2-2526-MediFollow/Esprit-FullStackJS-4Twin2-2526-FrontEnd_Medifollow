import { Component, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SpeechRecognitionService } from '../../services/speech-recognition.service';

@Component({
  selector: 'app-mic-button',
  templateUrl: './mic-button.component.html',
  styleUrls: ['./mic-button.component.css']
})
export class MicButtonComponent implements OnDestroy {
  @Input() lang = 'fr-FR';
  @Input() fieldName = '';
  @Output() transcriptReady = new EventEmitter<string>();

  listening = false;
  private sub?: Subscription;

readonly btnIdle      = 'mic-idle';
readonly btnListening = 'mic-listening';
  constructor(public speech: SpeechRecognitionService) {}

  toggle(): void {
    if (this.listening) {
      this.speech.stop();
      this.listening = false;
      this.sub?.unsubscribe();
    } else {
      this.listening = true;
      this.sub = this.speech.start(this.lang).subscribe(result => {
        if (result.isFinal) {
          this.transcriptReady.emit(result.transcript);
          this.listening = false;
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.speech.stop();
  }
}
