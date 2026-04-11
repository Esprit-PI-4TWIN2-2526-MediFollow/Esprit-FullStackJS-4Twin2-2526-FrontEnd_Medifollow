import {
  Component, OnDestroy,
  ViewChild, ElementRef,
AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,

} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { GestureControlService } from '../gesture-control.service';
import { GestureType } from '../gesture.models';

@Component({
  selector: 'app-gesture-overlay',
  templateUrl: './gesture-overlay.component.html',
  styleUrls: ['./gesture-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestureOverlayComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;

  cursorX = 0;
  cursorY = 0;
  isClicking = false;
  active = false;
  currentGesture: GestureType | null = null;

  /* readonly gestureLabels: Record<GestureType, { icon: string; label: string }> = {
    SCROLL_UP:   { icon: '☝️', label: 'Défiler vers le haut' },
    SCROLL_DOWN: { icon: '👇', label: 'Défiler vers le bas' },
    CLICK:       { icon: '🤏', label: 'Cliquer' },
    SWIPE_LEFT:  { icon: '👈', label: 'Page précédente' },
    SWIPE_RIGHT: { icon: '👉', label: 'Page suivante' },
    OPEN_HAND:   { icon: '✋', label: 'Stop' },
    PEACE:       { icon: '✌️', label: 'Menu' },
  }; */
readonly gestureLabels: Record<GestureType, { icon: string; label: string }> = {
  SCROLL_UP:   { icon: '☝️',  label: 'Défiler vers le haut' },
  SCROLL_DOWN: { icon: '👇',  label: 'Défiler vers le bas'  },
  CLICK:       { icon: '✊',  label: 'Cliquer'              },
  SWIPE_LEFT:  { icon: '✌️←', label: 'Page précédente'      },
  SWIPE_RIGHT: { icon: '✌️→', label: 'Page suivante'        },
  OPEN_HAND:   { icon: '✋',  label: 'Stop / Fermer'        },
  FIST:        { icon: '✊',  label: 'Cliquer'              },
};
  private sub = new Subscription();
  private badgeTimer: any;

  constructor(
    private gestureService: GestureControlService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.gestureService.init(this.videoEl.nativeElement);
    this.active = true;

    this.sub.add(
      this.gestureService.gesture$.subscribe((evt) => {
        this.cursorX = evt.x * window.innerWidth;
        this.cursorY = evt.y * window.innerHeight;
        this.currentGesture = evt.type;
        this.handleGesture(evt.type);
        this.scheduleBadgeReset();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.gestureService.destroy();
    clearTimeout(this.badgeTimer);
  }

  toggleActive(): void {
    this.active = !this.active;
    if (this.active) {
      this.gestureService.init(this.videoEl.nativeElement);
    } else {
      this.gestureService.destroy();
    }
  }

  get gestureInfo() {
    return this.currentGesture ? this.gestureLabels[this.currentGesture] : null;
  }

  /* private handleGesture(type: GestureType): void {
    switch (type) {
      case 'SCROLL_UP':
        window.scrollBy({ top: -150, behavior: 'smooth' });
        break;
      case 'SCROLL_DOWN':
        window.scrollBy({ top: 150, behavior: 'smooth' });
        break;
      case 'CLICK':
        this.simulateClick();
        break;
      case 'SWIPE_LEFT':
        this.router.navigate(['..']);
        break;
      case 'SWIPE_RIGHT':
        history.forward();
        break;
      case 'PEACE':
        document.dispatchEvent(new CustomEvent('medifollow:openMenu'));
        break;
      case 'OPEN_HAND':
        document.dispatchEvent(new CustomEvent('medifollow:escape'));
        break;
    }
  } */
private handleGesture(type: GestureType): void {
  switch (type) {
    case 'SCROLL_UP':
      window.scrollBy({ top: -150, behavior: 'smooth' });
      break;
    case 'SCROLL_DOWN':
      window.scrollBy({ top: 150, behavior: 'smooth' });
      break;
    case 'CLICK':
    case 'FIST':
      this.simulateClick();
      break;
    case 'SWIPE_LEFT':
      history.back();
      break;
    case 'SWIPE_RIGHT':
      history.forward();
      break;
    case 'OPEN_HAND':
      document.dispatchEvent(new CustomEvent('medifollow:escape'));
      break;
  }
}

  private simulateClick(): void {
    this.isClicking = true;
    const el = document.elementFromPoint(this.cursorX, this.cursorY) as HTMLElement;
    el?.click();
    setTimeout(() => {
      this.isClicking = false;
      this.cdr.markForCheck();
    }, 350);
  }

  private scheduleBadgeReset(): void {
    clearTimeout(this.badgeTimer);
    this.badgeTimer = setTimeout(() => {
      this.currentGesture = null;
      this.cdr.markForCheck();
    }, 1800);
  }
}
