export type VoiceIntent =
  | 'wake'
  | 'fill_field'
  | 'navigate'
  | 'next'
  | 'previous'
  | 'submit'
  | 'delete'
  | 'confirm'
  | 'cancel'
  | 'unknown';

export interface VoiceCommandPayload {
  intent: VoiceIntent;
  field?: string;
  value?: string | number | boolean | null;
  target?: string;
  rawText?: string;
}

export interface VoiceExecutionResult {
  handled: boolean;
  requiresConfirmation?: boolean;
  speech?: string;
}
