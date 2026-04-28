import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';

import { GestureSettingsComponent } from './gesture-settings.component';
import { GestureControlService } from '../gesture-control.service';
import { buildComponentTestingModule } from '../../testing/test-bed-helpers';

describe('GestureSettingsComponent', () => {
  let component: GestureSettingsComponent;
  let fixture: ComponentFixture<GestureSettingsComponent>;
  let gestureService: Partial<GestureControlService>;

  beforeEach(async () => {
    gestureService = {
      active$: new BehaviorSubject<boolean>(false),
      lastGesture$: new BehaviorSubject<any>(null),
      gesture$: new Subject<any>(),
      flushAuditLog: jasmine.createSpy('flushAuditLog').and.returnValue([]),
    };

    await TestBed.configureTestingModule(
      buildComponentTestingModule(GestureSettingsComponent, {
        providers: [
          { provide: GestureControlService, useValue: gestureService },
        ],
      }),
    ).compileComponents();

    fixture = TestBed.createComponent(GestureSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
