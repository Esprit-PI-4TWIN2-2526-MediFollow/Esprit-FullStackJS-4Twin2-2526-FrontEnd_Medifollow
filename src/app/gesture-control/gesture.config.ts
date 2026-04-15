import { InjectionToken } from '@angular/core';
import { GestureConfig } from './gesture.models';

export const GESTURE_CONFIG = new InjectionToken<Partial<GestureConfig>>(
  'GESTURE_CONFIG'
);
