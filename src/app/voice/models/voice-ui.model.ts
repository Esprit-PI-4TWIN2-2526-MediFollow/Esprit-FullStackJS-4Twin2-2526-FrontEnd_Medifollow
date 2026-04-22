export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceUiState {
  status: VoiceStatus;
  listening: boolean;
  activated: boolean;
  message: string;
  lastHeard: string;
}
