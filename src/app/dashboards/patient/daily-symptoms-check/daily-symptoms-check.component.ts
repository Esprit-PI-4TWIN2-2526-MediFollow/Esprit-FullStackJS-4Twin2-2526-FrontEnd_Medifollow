import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { SubmissionRecord } from './submission-record.model';

type DayStatus = 'submitted' | 'missed' | 'today' | 'future';

export const slideDown = trigger('slideDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-8px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [
    animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-8px)' })),
  ]),
]);

@Component({
  selector: 'app-daily-symptoms-check',
  templateUrl: './daily-symptoms-check.component.html',
  styleUrl: './daily-symptoms-check.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [slideDown],
})
export class DailySymptomsCheckComponent {
  @Input() totalDays = 22;
  @Input() currentDay = 1;
  @Input() submittedDays: number[] = [];
  @Input() missedDays: number[] = [];
  @Input() submissionHistory: SubmissionRecord[] = [];
  @Output() fillToday = new EventEmitter<void>();
  @Output() viewReport = new EventEmitter<number>();

  selectedDay: number | null = null;

  readonly circumference = 2 * Math.PI * 48; // ≈ 301.59

  // ── Computed stats ────────────────────────────────────────────────────

  get completedCount(): number {
    return this.submittedDays.length;
  }

  get missedCount(): number {
    return this.missedDays.length;
  }

  get remainingCount(): number {
    return this.totalDays - this.submittedDays.length - this.missedDays.length;
  }

  get progressPercent(): number {
    if (!this.totalDays) return 0;
    return Math.round((this.submittedDays.length / this.totalDays) * 100);
  }

  // ── SVG ring ──────────────────────────────────────────────────────────

  get strokeDashoffset(): number {
    return this.circumference * (1 - this.progressPercent / 100);
  }

  get todayDotCx(): number {
    const angle = (this.progressPercent / 100) * 2 * Math.PI - Math.PI / 2;
    return 55 + 48 * Math.cos(angle);
  }

  get todayDotCy(): number {
    const angle = (this.progressPercent / 100) * 2 * Math.PI - Math.PI / 2;
    return 55 + 48 * Math.sin(angle);
  }

  // ── Days ──────────────────────────────────────────────────────────────

  get daysArray(): number[] {
    return Array.from({ length: this.totalDays }, (_, i) => i + 1);
  }

  getDayStatus(day: number): DayStatus {
    if (day === this.currentDay) return 'today';
    if (this.submittedDays.includes(day)) return 'submitted';
    if (this.missedDays.includes(day)) return 'missed';
    return 'future';
  }

  // ── History panel ─────────────────────────────────────────────────────

  get selectedRecord(): SubmissionRecord | undefined {
    if (this.selectedDay === null) return undefined;
    return this.submissionHistory.find(r => r.day === this.selectedDay);
  }

  onDotClick(day: number, status: string): void {
    if (status === 'submitted') {
      this.selectedDay = this.selectedDay === day ? null : day;
    } else {
      this.selectedDay = null;
    }
  }

  closePanel(): void {
    this.selectedDay = null;
  }

  onViewReport(): void {
    if (this.selectedDay !== null) {
      this.viewReport.emit(this.selectedDay);
    }
  }

  getFeelingLabel(feeling: SubmissionRecord['overallFeeling']): string {
    const labels: Record<SubmissionRecord['overallFeeling'], string> = {
      good: 'Bien',
      average: 'Moyen',
      poor: 'Difficile',
    };
    return labels[feeling];
  }

  // ── CTA ───────────────────────────────────────────────────────────────

  onFillToday(): void {
    this.fillToday.emit();
  }
}
