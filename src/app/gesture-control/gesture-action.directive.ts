import { Directive, Input, HostBinding, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GestureType } from './gesture.models';
import { GestureControlService } from './gesture-control.service';
@Directive({
  selector: '[gestureAction]'
})
export class GestureActionDirective implements OnInit, OnDestroy {
  @Input('gestureAction') gesture!: GestureType;
  @Input() gestureTarget?: string;

  @HostBinding('class.gesture-hover') gestureHover = false;

  private sub = new Subscription();

  constructor(private gestureService: GestureControlService) {}

  ngOnInit(): void {
    this.sub.add(
      this.gestureService.gesture$
        .pipe(filter((evt) => evt.type === this.gesture))
        .subscribe(() => {
          this.gestureHover = true;
          setTimeout(() => (this.gestureHover = false), 400);
        })
    );
  }
ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
