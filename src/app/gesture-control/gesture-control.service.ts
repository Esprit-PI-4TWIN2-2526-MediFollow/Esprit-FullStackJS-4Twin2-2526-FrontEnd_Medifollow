import { Injectable, NgZone, Inject, Optional } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  GestureEvent, GestureType, GestureConfig,
  GestureLogEntry, DEFAULT_GESTURE_CONFIG,
} from './gesture.models';
import { GESTURE_CONFIG } from './gesture.config';

@Injectable({ providedIn: 'root' })
export class GestureControlService {
  readonly gesture$ = new Subject<GestureEvent>();
  readonly active$ = new BehaviorSubject<boolean>(false);
  readonly lastGesture$ = new BehaviorSubject<GestureType | null>(null);

  private hands: any;
  private videoElement!: HTMLVideoElement;
  private config: GestureConfig;

  private lastGestureType: GestureType | null = null;
  private lastGestureTime = 0;

  // ── Variables séparées pour chaque geste ──
  private swipeStartX: number | null = null;   // pour SWIPE gauche/droite
  private swipeStartTime = 0;

  private scrollDownStartY: number | null = null;  // pour SCROLL_DOWN
  private scrollDownStartTime = 0;

  private pinchStartTime: number | null = null;
  private pinchFired = false;

  private auditBuffer: GestureLogEntry[] = [];

  constructor(
    private ngZone: NgZone,
    @Optional() @Inject(GESTURE_CONFIG) config: Partial<GestureConfig>
  ) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...(config ?? {}) };
  }

  async init(videoEl: HTMLVideoElement): Promise<void> {
    this.videoElement = videoEl;
    const { Hands } = await import('@mediapipe/hands' as any);
    this.hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });
    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.72,
      minTrackingConfidence: 0.55,
    });
    this.hands.onResults((results: any) => this.processResults(results));
    await this.startCamera();
    this.active$.next(true);
  }

  destroy(): void {
    const stream = this.videoElement?.srcObject as MediaStream;
    stream?.getTracks().forEach((t) => t.stop());
    this.hands?.close?.();
    this.active$.next(false);
  }

  flushAuditLog(): GestureLogEntry[] {
    const logs = [...this.auditBuffer];
    this.auditBuffer = [];
    return logs;
  }

  private async startCamera(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    this.videoElement.srcObject = stream;
    await this.videoElement.play();
    this.runDetectionLoop();
  }

  private runDetectionLoop(): void {
    const loop = async () => {
      if (!this.active$.value) return;
      try { await this.hands.send({ image: this.videoElement }); } catch {}
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private processResults(results: any): void {
    if (!results.multiHandLandmarks?.length) {
      this.pinchStartTime = null;
      this.pinchFired = false;
      return;
    }
    const lm = results.multiHandLandmarks[0];
    const confidence: number = results.multiHandedness?.[0]?.score ?? 1;
    const gesture = this.detectGesture(lm);
    if (gesture) this.emitGesture(gesture, lm[8], confidence);
  }

  private detectGesture(lm: any[]): GestureType | null {
    const indexTip  = lm[8];
    const indexPIP  = lm[6];
    const middleTip = lm[12];
    const middlePIP = lm[10];
    const ringTip   = lm[16];
    const ringPIP   = lm[14];
    const pinkyTip  = lm[20];
    const pinkyPIP  = lm[18];
    const wrist     = lm[0];

    const indexUp  = indexTip.y  < indexPIP.y;
    const middleUp = middleTip.y < middlePIP.y;
    const ringUp   = ringTip.y   < ringPIP.y;
    const pinkyUp  = pinkyTip.y  < pinkyPIP.y;
    const fingersUpCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

    // ── MAIN OUVERTE ✋ → OPEN_HAND ──────────────
    if (fingersUpCount === 4) {
      this.resetAllTrackers();
      return 'OPEN_HAND';
    }

    // ── INDEX SEUL ☝️ → SCROLL_UP ────────────────
    if (indexUp && !middleUp && !ringUp && !pinkyUp) {
      this.resetAllTrackers();
      return 'SCROLL_UP';
    }

    // ── INDEX + MAJEUR ✌️ → SWIPE ────────────────
    if (indexUp && middleUp && !ringUp && !pinkyUp) {
      this.scrollDownStartY = null; // reset scroll down
      this.pinchStartTime = null;
      this.pinchFired = false;

      const now = Date.now();
      const palmX = wrist.x;

      if (this.swipeStartX === null) {
        this.swipeStartX = palmX;
        this.swipeStartTime = now;
      } else {
        const elapsed = now - this.swipeStartTime;
        const delta   = palmX - this.swipeStartX;

        if (elapsed < 700 && Math.abs(delta) > this.config.swipeMinDelta) {
          this.swipeStartX = null;
          return delta < 0 ? 'SWIPE_LEFT' : 'SWIPE_RIGHT';
        }
        if (elapsed > 700) {
          this.swipeStartX = palmX;
          this.swipeStartTime = now;
        }
      }
      return null;
    }

    // ── POING FERMÉ ✊ → CLICK ou SCROLL_DOWN ────
    if (fingersUpCount === 0) {
      this.swipeStartX = null; // reset swipe

      const now = Date.now();
      const palmY = wrist.y;

      // Suivi mouvement vertical pour SCROLL_DOWN
      if (this.scrollDownStartY === null) {
        this.scrollDownStartY = palmY;
        this.scrollDownStartTime = now;
        // Démarrer aussi le timer pour CLICK
        if (this.pinchStartTime === null) {
          this.pinchStartTime = now;
          this.pinchFired = false;
        }
      } else {
        const elapsed = now - this.scrollDownStartTime;
        const deltaY  = palmY - this.scrollDownStartY;

        // Mouvement vers le bas détecté → SCROLL_DOWN
        if (elapsed < 500 && deltaY > 0.07) {
          this.scrollDownStartY = null;
          this.pinchStartTime = null;
          this.pinchFired = false;
          return 'SCROLL_DOWN';
        }

        // Reset si trop long sans mouvement
        if (elapsed > 500) {
          this.scrollDownStartY = palmY;
          this.scrollDownStartTime = now;
        }

        // CLICK si poing fixe maintenu assez longtemps
        if (!this.pinchFired && now - (this.pinchStartTime ?? now) >= this.config.pinchHoldMs) {
          this.pinchFired = true;
          this.scrollDownStartY = null;
          return 'CLICK';
        }
      }

      return null;
    }

// // ── INDEX POINTÉ VERS LE BAS 👇 → SCROLL_DOWN ──
// // Main retournée : dos de la main vers vous, index vers le bas
// if (!indexUp && !middleUp && !ringUp && !pinkyUp === false) {
//   // index baissé mais tip EN DESSOUS du poignet
//   if (!indexUp && !middleUp && !ringUp && !pinkyUp &&
//       indexTip.y > wrist.y + 0.05) {
//     this.resetAllTrackers();
//     return 'SCROLL_DOWN';
//   }
// }

// // ── POING FERMÉ FIXE ✊ → CLICK uniquement ────
// if (fingersUpCount === 0) {
//   this.swipeStartX = null;
//   const now = Date.now();

//   if (this.pinchStartTime === null) {
//     this.pinchStartTime = now;
//     this.pinchFired = false;
//   } else if (!this.pinchFired && now - this.pinchStartTime >= this.config.pinchHoldMs) {
//     this.pinchFired = true;
//     return 'CLICK';
//   }
//   return null;
// }

    // Aucun geste reconnu → reset tout
    this.resetAllTrackers();
    return null;
  }

  // Remet à zéro tous les trackers
  private resetAllTrackers(): void {
    this.swipeStartX = null;
    this.scrollDownStartY = null;
    this.pinchStartTime = null;
    this.pinchFired = false;
  }

  private emitGesture(type: GestureType, indexTip: any, confidence: number): void {
    const now = Date.now();
    if (type === this.lastGestureType && now - this.lastGestureTime < this.config.cooldownMs) return;

    this.lastGestureType = type;
    this.lastGestureTime = now;

    const event: GestureEvent = {
      type,
      x: 1 - indexTip.x,
      y: indexTip.y,
      timestamp: now,
      confidence,
    };

    if (this.config.auditLog) {
      this.auditBuffer.push({
        gesture: type,
        timestamp: new Date(now).toISOString(),
        screenX: Math.round(event.x * window.innerWidth),
        screenY: Math.round(event.y * window.innerHeight),
      });
    }

    if (this.config.audioFeedback) this.playBeep(type);

    this.ngZone.run(() => {
      this.lastGesture$.next(type);
      this.gesture$.next(event);
    });
  }

  private playBeep(type: GestureType): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = type === 'CLICK' ? 880 : 440;
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  }

  private dist2D(a: any, b: any): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}
