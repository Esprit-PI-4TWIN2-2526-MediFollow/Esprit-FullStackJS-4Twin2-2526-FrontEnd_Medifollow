import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import {
  VoiceContextSnapshot,
  VoiceFormRef,
  VoiceSafetyAction,
} from '../models/voice-context.model';

@Injectable({ providedIn: 'root' })
export class VoiceContextService {
  private currentPage = 'unknown';
  private currentQuestion: string | null = null;
  private activeFormRef: VoiceFormRef | null = null;
  private pendingSafetyAction: VoiceSafetyAction | null = null;

  private readonly snapshotSubject = new BehaviorSubject<VoiceContextSnapshot>(
    this.buildSnapshot(),
  );

  readonly snapshot$ = this.snapshotSubject.asObservable();

  setCurrentPage(page: string): void {
    this.currentPage = page || 'unknown';
    this.emitSnapshot();
  }

  setCurrentQuestion(question: string | null): void {
    this.currentQuestion = question;
    this.emitSnapshot();
  }

  registerActiveForm(ref: VoiceFormRef): void {
    this.activeFormRef = ref;
    this.emitSnapshot();
  }

  clearActiveForm(formId?: string): void {
    if (!this.activeFormRef) {
      return;
    }

    if (!formId || this.activeFormRef.id === formId) {
      this.activeFormRef = null;
      this.emitSnapshot();
    }
  }

  getActiveForm(): FormGroup | null {
    return this.activeFormRef?.form ?? null;
  }

  getCurrentPage(): string {
    return this.currentPage;
  }

  getCurrentQuestion(): string | null {
    return this.currentQuestion;
  }

  getControlNames(): string[] {
    return this.activeFormRef ? Object.keys(this.activeFormRef.form.controls) : [];
  }

  triggerSubmit(): boolean {
    return this.activeFormRef?.onSubmit?.() ?? false;
  }

  triggerDelete(): boolean {
    return this.activeFormRef?.onDelete?.() ?? false;
  }

  setPendingSafetyAction(action: VoiceSafetyAction): void {
    this.pendingSafetyAction = action;
  }

  getPendingSafetyAction(): VoiceSafetyAction | null {
    return this.pendingSafetyAction;
  }

  clearPendingSafetyAction(): void {
    this.pendingSafetyAction = null;
  }

  private emitSnapshot(): void {
    this.snapshotSubject.next(this.buildSnapshot());
  }

  private buildSnapshot(): VoiceContextSnapshot {
    return {
      currentPage: this.currentPage,
      currentQuestion: this.currentQuestion,
      hasActiveForm: !!this.activeFormRef,
      formControlNames: this.activeFormRef
        ? Object.keys(this.activeFormRef.form.controls)
        : [],
    };
  }
}
