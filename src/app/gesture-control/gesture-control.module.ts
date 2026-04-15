import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GestureControlRoutingModule } from './gesture-control-routing.module';
import { GestureActionDirective } from './gesture-action.directive';
import { GestureOverlayComponent } from './gesture-overlay/gesture-overlay.component';
import { GestureSettingsComponent } from './gesture-settings/gesture-settings.component';
import { RouterModule } from '@angular/router';
import { GestureConfig } from './gesture.models';
import { GestureControlService } from './gesture-control.service';
import { GESTURE_CONFIG } from './gesture.config';


@NgModule({
  declarations: [
    GestureActionDirective,
    GestureOverlayComponent,
    GestureSettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    GestureControlRoutingModule
  ],
  exports: [
    GestureOverlayComponent,
    GestureSettingsComponent,
    GestureActionDirective,
  ],
})
export class GestureControlModule {

static forRoot(config: Partial<GestureConfig> = {}): ModuleWithProviders<GestureControlModule> {
    return {
      ngModule: GestureControlModule,
      providers: [
        GestureControlService,
        { provide: GESTURE_CONFIG, useValue: config },
      ],
    };
  }
 }
