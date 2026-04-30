import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { GestureOverlayComponent } from './gesture-overlay.component';
import { GestureControlService } from '../gesture-control.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('GestureOverlayComponent', () => {
  let component: GestureOverlayComponent;
  let fixture: ComponentFixture<GestureOverlayComponent>;
  let gestureService: jasmine.SpyObj<GestureControlService> & { gesture$: Subject<any> };

  beforeEach(async () => {
    gestureService = Object.assign(
      jasmine.createSpyObj<GestureControlService>('GestureControlService', ['init', 'destroy']),
      { gesture$: new Subject<any>() },
    );
    gestureService.init.and.resolveTo();

    await TestBed.configureTestingModule(
      buildComponentTestingModule(GestureOverlayComponent, {
        providers: [
          { provide: GestureControlService, useValue: gestureService },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(GestureOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
