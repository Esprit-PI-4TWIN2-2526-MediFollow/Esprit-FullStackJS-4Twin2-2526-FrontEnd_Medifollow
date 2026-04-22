import {
  Directive,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { VoiceContextService } from '../services/voice-context.service';

@Directive({
  selector: '[appVoiceContext]',
  standalone: true,
})
export class VoiceContextDirective implements OnChanges, OnDestroy {
  @Input('appVoiceContext') form: FormGroup | null = null;
  @Input() voiceFormId = 'default-form';
  @Input() voiceQuestion: string | null = null;
  @Input() onVoiceSubmit?: () => boolean;
  @Input() onVoiceDelete?: () => boolean;

  constructor(private readonly context: VoiceContextService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['voiceQuestion']) {
      this.context.setCurrentQuestion(this.voiceQuestion);
    }

    if (this.form) {
      this.context.registerActiveForm({
        id: this.voiceFormId,
        form: this.form,
        onSubmit: this.onVoiceSubmit,
        onDelete: this.onVoiceDelete,
      });
    }
  }

  ngOnDestroy(): void {
    this.context.clearActiveForm(this.voiceFormId);
  }
}
