# Skander Voice Assistant (Vapi)

This folder contains a full voice assistant subsystem for MediFollow.

## What is included

- `VoiceAssistantService`: wake word, transcript pipeline, speech synthesis, and command dispatch.
- `VapiVoiceClient`: Vapi session bridge (`window.Vapi`) and message stream handling.
- `VoiceCommandRouterService`: executes intents (`fill_field`, `navigate`, `next`, `previous`, `submit`, `confirm`, `cancel`).
- `VoiceContextService`: stores current page, active form, and current question context.
- `VoiceContextDirective`: registers forms for voice control.
- `VoiceAssistantComponent`: floating voice button with listening/speaking UI feedback.

## Vapi runtime config

At runtime, set one of these:

- `window.__MEDIFOLLOW_VOICE__ = { publicApiKey: '...', assistantId: '...', wakeWord: 'skander' }`
- `localStorage.setItem('MEDIFOLLOW_VAPI_PUBLIC_KEY', '...')`
- `localStorage.setItem('MEDIFOLLOW_VAPI_ASSISTANT_ID', '...')`

## Integration example (outside this folder)

1. Render floating assistant:

```html
<app-voice-assistant />
```

2. Register a form for commands:

```html
<form
  [formGroup]="patientForm"
  [appVoiceContext]="patientForm"
  voiceFormId="triage-form"
  [voiceQuestion]="currentQuestion"
  [onVoiceSubmit]="onVoiceSubmit"
>
</form>
```

3. Import standalone artifacts where needed:

- `VoiceAssistantComponent`
- `VoiceContextDirective`

4. Example command JSON from Vapi:

```json
{
  "intent": "fill_field",
  "field": "temperature",
  "value": 37
}
```

This maps to:

```ts
this.form.get('temperature')?.setValue(37);
```

## Safety behavior

`submit` and `delete` are confirmation-gated. User must say `confirm` before execution.
