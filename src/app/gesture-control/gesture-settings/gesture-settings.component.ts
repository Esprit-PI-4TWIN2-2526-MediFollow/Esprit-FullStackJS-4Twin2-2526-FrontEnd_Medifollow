import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { GestureControlService } from '../gesture-control.service';
import { GestureType, GestureLogEntry } from '../gesture.models';

@Component({
  selector: 'app-gesture-settings',
  templateUrl: './gesture-settings.component.html',
  styleUrls: ['./gesture-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestureSettingsComponent implements OnInit, OnDestroy {
  cameraActive = false;
  lastGesture: GestureType | null = null;
  auditLogs: GestureLogEntry[] = [];

  gestureMap = [
    { gesture: 'SCROLL_UP',   icon: '☝️', action: 'Défiler vers le haut' },
    { gesture: 'SCROLL_DOWN', icon: '👇', action: 'Défiler vers le bas' },
    { gesture: 'CLICK',       icon: '🤏', action: 'Cliquer (pinch 600ms)' },
    { gesture: 'SWIPE_LEFT',  icon: '👈', action: 'Page précédente' },
    { gesture: 'SWIPE_RIGHT', icon: '👉', action: 'Page suivante' },
    { gesture: 'PEACE',       icon: '✌️', action: 'Ouvrir le menu' },
    { gesture: 'OPEN_HAND',   icon: '✋', action: 'Stop / Fermer' },
  ];

  private sub = new Subscription();

  constructor(
    private gestureService: GestureControlService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sub.add(
      this.gestureService.active$.subscribe((v) => {
        this.cameraActive = v;
        this.cdr.markForCheck();
      })
    );
    this.sub.add(
      this.gestureService.lastGesture$.subscribe((g) => {
        this.lastGesture = g;
        this.cdr.markForCheck();
      })
    );
    this.sub.add(
      this.gestureService.gesture$.subscribe(() => {
        this.auditLogs = this.gestureService.flushAuditLog();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  flushLogs(): void {
    const logs = this.gestureService.flushAuditLog();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medifollow-gesture-log-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.auditLogs = [];
    this.cdr.markForCheck();
  }
}
