import { FormGroup } from '@angular/forms';

export interface VoiceContextSnapshot {
  currentPage: string;
  currentQuestion: string | null;
  hasActiveForm: boolean;
  formControlNames: string[];
}

export interface VoiceSafetyAction {
  id: string;
  intent: 'submit' | 'delete';
  description: string;
  run: () => boolean;
}

export interface VoiceFormRef {
  id: string;
  form: FormGroup;
  onSubmit?: () => boolean;
  onDelete?: () => boolean;
}
