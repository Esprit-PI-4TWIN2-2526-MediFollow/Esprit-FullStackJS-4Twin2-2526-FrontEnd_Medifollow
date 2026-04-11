import { Injectable, NgZone, Inject, Optional } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  GestureEvent,
  GestureType,
  GestureConfig,
  GestureLogEntry,
  DEFAULT_GESTURE_CONFIG,
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

  private swipeStartX: number | null = null;
  private swipeStartTime = 0;

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
      try {
        await this.hands.send({ image: this.videoElement });
      } catch {}
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

/*  private detectGesture(lm: any[]): GestureType | null {
    const indexTip  = lm[8];
    const thumbTip  = lm[4];
    const middleTip = lm[12];
    const ringTip   = lm[16];
    const pinkyTip  = lm[20];
    const indexMCP  = lm[5];
    const middleMCP = lm[9];
    const wrist     = lm[0];

    const pinchDist = this.dist2D(indexTip, thumbTip);

    // CLICK — pinch maintenu
    if (pinchDist < this.config.pinchThreshold) {
      const now = Date.now();
      if (this.pinchStartTime === null) {
        this.pinchStartTime = now;
        this.pinchFired = false;
      } else if (!this.pinchFired && now - this.pinchStartTime >= this.config.pinchHoldMs) {
        this.pinchFired = true;
        return 'CLICK';
      }
      return null;
    } else {
      this.pinchStartTime = null;
      this.pinchFired = false;
    }

    // PEACE ✌️
    const isPeace =
      indexTip.y < indexMCP.y - 0.10 &&
      middleTip.y < middleMCP.y - 0.10 &&
      ringTip.y > middleMCP.y &&
      pinkyTip.y > middleMCP.y;
    if (isPeace) return 'PEACE';

    // OPEN HAND ✋
    const fingersUp = [8, 12, 16, 20].filter(i => lm[i].y < lm[i - 2].y).length;
    if (fingersUp === 4) return 'OPEN_HAND';

    // SCROLL UP / DOWN ☝️
    const indexOnly =
      indexTip.y < indexMCP.y - 0.12 &&
      middleTip.y > middleMCP.y &&
      ringTip.y > middleMCP.y;

    if (indexOnly) {
      if (indexTip.y < indexMCP.y - 0.20) return 'SCROLL_UP';
      if (indexTip.y > indexMCP.y + 0.05) return 'SCROLL_DOWN';
    }

    // SWIPE
    const palmX = wrist.x;
    const now = Date.now();
    if (this.swipeStartX === null) {
      this.swipeStartX = palmX;
      this.swipeStartTime = now;
    } else {
      const elapsed = now - this.swipeStartTime;
      const delta = palmX - this.swipeStartX;
      if (elapsed < 600 && Math.abs(delta) > this.config.swipeMinDelta) {
        this.swipeStartX = null;
        return delta < 0 ? 'SWIPE_LEFT' : 'SWIPE_RIGHT';
      }
      if (elapsed > 600) {
        this.swipeStartX = palmX;
        this.swipeStartTime = now;
      }
    }

    return null;
  }*/

private detectGesture(lm: any[]): GestureType | null {
  // Points clés
  const thumbTip   = lm[4];
  const indexTip   = lm[8];
  const indexPIP   = lm[6];   // articulation milieu index
  const indexMCP   = lm[5];   // base index
  const middleTip  = lm[12];
  const middlePIP  = lm[10];
  const ringTip    = lm[16];
  const ringPIP    = lm[14];
  const pinkyTip   = lm[20];
  const pinkyPIP   = lm[18];
  const wrist      = lm[0];

  // Doigt levé = tip plus haut (y plus petit) que PIP
  const indexUp  = indexTip.y  < indexPIP.y;
  const middleUp = middleTip.y < middlePIP.y;
  const ringUp   = ringTip.y   < ringPIP.y;
  const pinkyUp  = pinkyTip.y  < pinkyPIP.y;

  const fingersUpCount = [indexUp, middleUp, ringUp, pinkyUp].filter(Boolean).length;

  // ── POING FERMÉ → CLICK ──────────────────────
  // Aucun doigt levé
  if (fingersUpCount === 0) {
    const now = Date.now();
    if (this.pinchStartTime === null) {
      this.pinchStartTime = now;
      this.pinchFired = false;
    } else if (!this.pinchFired && now - this.pinchStartTime >= this.config.pinchHoldMs) {
      this.pinchFired = true;
      return 'CLICK';
    }
    return null;
  } else {
    this.pinchStartTime = null;
    this.pinchFired = false;
  }

  // ── MAIN OUVERTE → OPEN_HAND ─────────────────
  // 4 doigts levés
  if (fingersUpCount === 4) return 'OPEN_HAND';

  // ── INDEX SEUL LEVÉ ──────────────────────────
  if (indexUp && !middleUp && !ringUp && !pinkyUp) {
    // Index pointé vers le haut → SCROLL_UP
    if (indexTip.y < wrist.y - 0.25) return 'SCROLL_UP';
    // Index pointé vers le bas → SCROLL_DOWN
    if (indexTip.y > indexMCP.y)     return 'SCROLL_DOWN';
  }

  // ── INDEX + MAJEUR → SWIPE ───────────────────
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
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
  } else {
    // Réinitialiser swipe si autre geste
    this.swipeStartX = null;
  }

  return null;
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
