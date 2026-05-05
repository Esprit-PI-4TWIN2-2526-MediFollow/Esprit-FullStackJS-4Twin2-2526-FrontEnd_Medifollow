import {
  Component, OnDestroy,
  ViewChild, ElementRef,
AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef,

} from '@angular/core';
import { Subscription } from 'rxjs';
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
  isInitializing = false;
  statusMessage = '';
  hasError = false;
  hoveredElementDescription = '';
  private lastHoveredElement: HTMLElement | null = null;


// readonly gestureLabels: Record<GestureType, { icon: string; label: string }> = {
//   SCROLL_UP:   { icon: '☝️',  label: 'Défiler vers le haut' },
//   SCROLL_DOWN: { icon: '👇',  label: 'Défiler vers le bas'  },
//   CLICK:       { icon: '✊',  label: 'Cliquer'              },
//   SWIPE_LEFT:  { icon: '✌️←', label: 'Page précédente'      },
//   SWIPE_RIGHT: { icon: '✌️→', label: 'Page suivante'        },
//   OPEN_HAND:   { icon: '✋',  label: 'Stop / Fermer'        },
//   FIST:        { icon: '✊',  label: 'Cliquer'              },
// };

readonly gestureLabels: Record<GestureType, { icon: string; label: string }> = {
  SCROLL_UP:   { icon: '☝️',  label: 'Défiler vers le haut'           },
//SCROLL_DOWN: { icon: '👇', label: 'Index pointé vers le bas' },
SCROLL_DOWN: { icon: '✊↓', label: 'Poing + descendre la main'      },
  CLICK:       { icon: '✊',  label: 'Poing maintenu 400ms'           },
  SWIPE_LEFT:  { icon: '✌️←', label: 'Page précédente'               },
  SWIPE_RIGHT: { icon: '✌️→', label: 'Page suivante'                 },
  OPEN_HAND:   { icon: '✋',  label: 'Stop / Fermer'                  },
  FIST:        { icon: '✊',  label: 'Poing maintenu 400ms'           },
};
  private sub = new Subscription();
  private badgeTimer: any;

  constructor(
    private gestureService: GestureControlService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    // Don't auto-start, wait for user to click toggle
    this.active = false;
    
    console.log('🎬 Gesture overlay component initialized');
    
    this.sub.add(
      this.gestureService.gesture$.subscribe((evt) => {
        console.log('📍 Gesture event received:', evt);
        console.log('📍 Cursor position will be:', evt.x * window.innerWidth, evt.y * window.innerHeight);
        
        this.cursorX = evt.x * window.innerWidth;
        this.cursorY = evt.y * window.innerHeight;
        this.currentGesture = evt.type;
        this.handleGesture(evt.type);
        this.updateHoveredElement();
        this.scheduleBadgeReset();
        this.cdr.markForCheck();
        
        console.log('📍 Cursor updated to:', this.cursorX, this.cursorY);
      })
    );
    
    console.log('✅ Gesture subscription active');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.gestureService.destroy();
    clearTimeout(this.badgeTimer);
  }

  async toggleActive(): Promise<void> {
    console.log('🔘 Toggle clicked. Current state:', this.active);
    
    if (this.isInitializing) return;
    
    this.active = !this.active;
    console.log('🔘 New state:', this.active);
    
    if (this.active) {
      this.isInitializing = true;
      this.statusMessage = 'Initializing camera...';
      this.hasError = false;
      this.cdr.markForCheck();
      
      try {
        console.log('📹 Requesting camera access...');
        console.log('📹 Video element:', this.videoEl?.nativeElement);
        
        await this.gestureService.init(this.videoEl.nativeElement);
        
        this.statusMessage = 'Camera active ✓';
        this.hasError = false;
        console.log('✅ Gesture control activated successfully');
        
        setTimeout(() => {
          this.statusMessage = '';
          this.cdr.markForCheck();
        }, 3000);
        
      } catch (error: any) {
        console.error('❌ Failed to start gesture control:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        this.active = false;
        this.hasError = true;
        
        // Show user-friendly error message
        if (error.message.includes('permission')) {
          this.statusMessage = '❌ Camera permission denied';
        } else if (error.message.includes('not found') || error.message.includes('No camera')) {
          this.statusMessage = '❌ No camera found';
        } else if (error.message.includes('in use') || error.message.includes('already')) {
          this.statusMessage = '❌ Camera in use';
        } else if (error.message.includes('HTTPS') || error.message.includes('secure')) {
          this.statusMessage = '❌ Requires HTTPS';
        } else {
          this.statusMessage = `❌ ${error.message}`;
        }
        
        setTimeout(() => {
          this.statusMessage = '';
          this.hasError = false;
          this.cdr.markForCheck();
        }, 5000);
      } finally {
        this.isInitializing = false;
        this.cdr.markForCheck();
      }
    } else {
      this.gestureService.destroy();
      this.statusMessage = 'Camera stopped';
      console.log('🛑 Gesture control deactivated');
      
      setTimeout(() => {
        this.statusMessage = '';
        this.cdr.markForCheck();
      }, 2000);
    }
    
    this.cdr.markForCheck();
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

  private updateHoveredElement(): void {
    const el = document.elementFromPoint(this.cursorX, this.cursorY) as HTMLElement;
    
    if (el === this.lastHoveredElement) {
      return; // Same element, no need to update
    }
    
    this.lastHoveredElement = el;
    
    if (!el) {
      this.hoveredElementDescription = '';
      return;
    }
    
    // Get description from various sources
    const description = this.getElementDescription(el);
    this.hoveredElementDescription = description;
  }

  private getElementDescription(el: HTMLElement): string {
    // Priority 1: aria-label
    if (el.getAttribute('aria-label')) {
      return el.getAttribute('aria-label')!;
    }
    
    // Priority 2: title attribute
    if (el.getAttribute('title')) {
      return el.getAttribute('title')!;
    }
    
    // Priority 3: data-gesture-hint custom attribute
    if (el.getAttribute('data-gesture-hint')) {
      return el.getAttribute('data-gesture-hint')!;
    }
    
    // Priority 4: Button text content
    if (el.tagName === 'BUTTON' || el.closest('button')) {
      const button = el.tagName === 'BUTTON' ? el : el.closest('button')!;
      const text = button.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) {
        return `Button: ${text}`;
      }
    }
    
    // Priority 5: Link text or href
    if (el.tagName === 'A' || el.closest('a')) {
      const link = el.tagName === 'A' ? el as HTMLAnchorElement : el.closest('a')!;
      const text = link.textContent?.trim();
      if (text && text.length > 0 && text.length < 50) {
        return `Link: ${text}`;
      }
      if (link.href) {
        const url = new URL(link.href);
        return `Navigate to: ${url.pathname}`;
      }
    }
    
    // Priority 6: Input/textarea placeholder or label
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const input = el as HTMLInputElement;
      if (input.placeholder) {
        return `Input: ${input.placeholder}`;
      }
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        return `Input: ${label.textContent?.trim()}`;
      }
      return `Input field`;
    }
    
    // Priority 7: Select dropdown
    if (el.tagName === 'SELECT') {
      const select = el as HTMLSelectElement;
      const label = document.querySelector(`label[for="${select.id}"]`);
      if (label) {
        return `Select: ${label.textContent?.trim()}`;
      }
      return `Dropdown menu`;
    }
    
    // Priority 8: Clickable elements with specific classes
    if (el.classList.contains('card') || el.closest('.card')) {
      return 'Click to view details';
    }
    
    if (el.classList.contains('notification') || el.closest('.notification')) {
      return 'Click to view notification';
    }
    
    // Priority 9: Generic clickable element
    if (el.onclick || el.style.cursor === 'pointer' || window.getComputedStyle(el).cursor === 'pointer') {
      return 'Clickable element';
    }
    
    return '';
  }
}
