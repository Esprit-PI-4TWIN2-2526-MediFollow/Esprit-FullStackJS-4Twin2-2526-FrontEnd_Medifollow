
export type GestureType =
  | 'SCROLL_UP'
  | 'SCROLL_DOWN'
  | 'CLICK'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'OPEN_HAND'
  | 'FIST';

export interface GestureEvent {
  type: GestureType;
  x: number;
  y: number;
  timestamp: number;
  confidence: number;
}

export interface GestureConfig {
  cooldownMs: number;
  pinchThreshold: number;
  pinchHoldMs: number;
  swipeMinDelta: number;
  audioFeedback: boolean;
  auditLog: boolean;
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  cooldownMs: 1000,
  pinchThreshold: 0.07,
  pinchHoldMs: 400,
  swipeMinDelta: 0.18,
  audioFeedback: true,
  auditLog: true,
};

export interface GestureLogEntry {
  gesture: GestureType;
  timestamp: string;
  screenX: number;
  screenY: number;
}


// export type GestureType =
//   | 'SCROLL_UP'
//   | 'SCROLL_DOWN'
//   | 'CLICK'
//   | 'SWIPE_LEFT'
//   | 'SWIPE_RIGHT'
//   | 'OPEN_HAND'
//   | 'PEACE';

// export interface GestureEvent {
//   type: GestureType;
//   x: number;
//   y: number;
//   timestamp: number;
//   confidence: number;
// }

// export interface GestureConfig {
//   cooldownMs: number;
//   pinchThreshold: number;
//   pinchHoldMs: number;
//   swipeMinDelta: number;
//   audioFeedback: boolean;
//   auditLog: boolean;
// }

// export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
//   cooldownMs: 800,
//   pinchThreshold: 0.06,
//   pinchHoldMs: 600,
//   swipeMinDelta: 0.2,
//   audioFeedback: true,
//   auditLog: true,
// };

// export interface GestureLogEntry {
//   gesture: GestureType;
//   timestamp: string;
//   screenX: number;
//   screenY: number;
// }
