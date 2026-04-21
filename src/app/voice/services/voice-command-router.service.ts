import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AbstractControl, FormGroup } from '@angular/forms';
import {
  VoiceCommandPayload,
  VoiceExecutionResult,
} from '../models/voice-command.model';
import { VoiceContextService } from './voice-context.service';

@Injectable({ providedIn: 'root' })
export class VoiceCommandRouterService {
  private readonly routeAliases: Record<string, string> = {
    dashboard: '/ecommerce',
    home: '/ecommerce',
    profile: '/profile',
    notifications: '/notifications',
    forms: '/form-elements',
    invoices: '/invoice',
  };

  constructor(
    private readonly router: Router,
    private readonly context: VoiceContextService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  async execute(command: VoiceCommandPayload): Promise<VoiceExecutionResult> {
    switch (command.intent) {
      case 'fill_field':
        return this.fillField(command);
      case 'navigate':
        return this.navigate(command.target);
      case 'next':
        return this.moveFocus(1);
      case 'previous':
        return this.moveFocus(-1);
      case 'submit':
        return this.prepareConfirmation('submit');
      case 'delete':
        return this.prepareConfirmation('delete');
      case 'confirm':
        return this.confirmPendingAction();
      case 'cancel':
        this.context.clearPendingSafetyAction();
        return { handled: true, speech: 'Canceled.' };
      default:
        return { handled: false, speech: 'I did not understand that command.' };
    }
  }

  private fillField(command: VoiceCommandPayload): VoiceExecutionResult {
    const form = this.context.getActiveForm();
    if (!form) {
      return { handled: false, speech: 'No active form is selected.' };
    }

    const fieldName = (command.field ?? '').trim();
    if (!fieldName) {
      return { handled: false, speech: 'Please tell me which field to fill.' };
    }

    const control = this.findControl(form, fieldName);
    if (!control) {
      return {
        handled: false,
        speech: `Field ${fieldName} was not found in the current form.`,
      };
    }

    control.setValue(command.value ?? null);
    control.markAsDirty();
    control.markAsTouched();

    return {
      handled: true,
      speech: `${this.humanizeFieldName(fieldName)} recorded.`,
    };
  }

  private async navigate(target?: string): Promise<VoiceExecutionResult> {
    const normalized = (target ?? '').trim().toLowerCase();
    if (!normalized) {
      return { handled: false, speech: 'Please tell me where to navigate.' };
    }

    const destination =
      this.routeAliases[normalized] ??
      (normalized.startsWith('/') ? normalized : `/${normalized}`);

    try {
      await this.router.navigateByUrl(destination);
      return { handled: true, speech: `Navigating to ${normalized}.` };
    } catch {
      return { handled: false, speech: 'Navigation failed.' };
    }
  }

  private moveFocus(direction: 1 | -1): VoiceExecutionResult {
    const inputs = Array.from(
      this.document.querySelectorAll<HTMLElement>(
        'input:not([type="hidden"]), textarea, select, button',
      ),
    ).filter((element) => {
      const disabled = element.getAttribute('disabled') !== null;
      const hidden = element.getAttribute('aria-hidden') === 'true';
      return !disabled && !hidden && this.isVisible(element);
    });

    if (inputs.length === 0) {
      return { handled: false, speech: 'No focusable fields on this page.' };
    }

    const active = this.document.activeElement as HTMLElement | null;
    const currentIndex = active ? inputs.indexOf(active) : -1;
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + inputs.length) % inputs.length;

    inputs[nextIndex]?.focus();

    return {
      handled: true,
      speech: direction === 1 ? 'Moved to next field.' : 'Moved to previous field.',
    };
  }

  private prepareConfirmation(intent: 'submit' | 'delete'): VoiceExecutionResult {
    this.context.setPendingSafetyAction({
      id: `${intent}-${Date.now()}`,
      intent,
      description: intent === 'submit' ? 'submit the form' : 'delete data',
      run: () => (intent === 'submit' ? this.context.triggerSubmit() : this.context.triggerDelete()),
    });

    return {
      handled: true,
      requiresConfirmation: true,
      speech:
        intent === 'submit'
          ? 'Please confirm submit. Say confirm to continue or cancel to stop.'
          : 'Please confirm delete. Say confirm to continue or cancel to stop.',
    };
  }

  private confirmPendingAction(): VoiceExecutionResult {
    const pending = this.context.getPendingSafetyAction();
    if (!pending) {
      return { handled: false, speech: 'There is nothing to confirm.' };
    }

    const ok = pending.run();
    this.context.clearPendingSafetyAction();

    if (ok) {
      return {
        handled: true,
        speech: pending.intent === 'submit' ? 'Form submitted.' : 'Delete completed.',
      };
    }

    return {
      handled: false,
      speech:
        pending.intent === 'submit'
          ? 'Submit action is not available in this context.'
          : 'Delete action is not available in this context.',
    };
  }

  private findControl(form: FormGroup, requestedField: string): AbstractControl | null {
    const direct = form.get(requestedField);
    if (direct) {
      return direct;
    }

    const normalizedRequested = this.normalizeKey(requestedField);
    const key = Object.keys(form.controls).find(
      (candidate) => this.normalizeKey(candidate) === normalizedRequested,
    );

    return key ? form.get(key) : null;
  }

  private normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private humanizeFieldName(field: string): string {
    return field
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .trim();
  }

  private isVisible(element: HTMLElement): boolean {
    const style = this.document.defaultView?.getComputedStyle(element);
    if (!style) {
      return true;
    }

    return style.display !== 'none' && style.visibility !== 'hidden';
  }
}
