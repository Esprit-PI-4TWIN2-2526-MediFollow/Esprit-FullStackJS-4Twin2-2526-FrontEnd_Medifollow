import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

type DayStatus = 'submitted' | 'missed' | 'today' | 'future';

@Component({
  selector: 'app-daily-symptoms-check',
  templateUrl: './daily-symptoms-check.component.html',
  styleUrl: './daily-symptoms-check.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailySymptomsCheckComponent {
  @Input() totalDays = 22;
  @Input() currentDay = 1;
  @Input() submittedDays: number[] = [];
  @Input() missedDays: number[] = [];
  @Output() fillToday = new EventEmitter<void>();

  readonly circumference = 2 * Math.PI * 48; // ≈ 301.59

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

  get daysArray(): number[] {
    return Array.from({ length: this.totalDays }, (_, i) => i + 1);
  }

  getDayStatus(day: number): DayStatus {
    if (day === this.currentDay) return 'today';
    if (this.submittedDays.includes(day)) return 'submitted';
    if (this.missedDays.includes(day)) return 'missed';
    return 'future';
  }

  onFillToday(): void {
    this.fillToday.emit();
  }
}
