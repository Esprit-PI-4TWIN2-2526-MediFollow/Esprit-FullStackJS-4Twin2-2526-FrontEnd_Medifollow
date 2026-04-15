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
  @Input() lang = 'fr-FR'; // langue de reconnaissance, configurable depuis le parent
  @Input() fieldName = '';  // identifiant du champ (pour usage dans le template)
  @Output() transcriptReady = new EventEmitter<string>(); // envoie le texte final au parent

  listening = false;
  private sub?: Subscription;

readonly btnIdle      = 'mic-idle'; // classe CSS état repos
readonly btnListening = 'mic-listening'; // classe CSS état actif
  constructor(public speech: SpeechRecognitionService) {}

  toggle(): void {
    if (this.listening) {
//arrete l'écoute en cours, que ce soit pour ce champ ou un autre
      this.speech.stop();
      this.listening = false;
      this.sub?.unsubscribe();
    } else {
//démarre l'écoute pour ce champ, en arrêtant proprement tout autre champ qui écouterait déjà
      this.listening = true;
      this.sub = this.speech.start(this.lang).subscribe(result => {
        if (result.isFinal) {
          this.transcriptReady.emit(result.transcript);
          this.listening = false;
        }
      });
    }
  }


// coupe le micro si le composant est détruit en cours d'écoute

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.speech.stop();
  }
}
