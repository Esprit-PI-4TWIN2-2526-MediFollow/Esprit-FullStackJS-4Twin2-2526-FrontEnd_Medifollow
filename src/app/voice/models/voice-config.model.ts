export interface VoiceAssistantConfig {
  wakeWord: string;
  assistantId: string;
  publicApiKey: string;
  activeWindowMs: number;
}

export const DEFAULT_VOICE_ASSISTANT_CONFIG: VoiceAssistantConfig = {
  wakeWord: 'skander',
  assistantId: '',
  publicApiKey: '',
  activeWindowMs: 20000,
};
