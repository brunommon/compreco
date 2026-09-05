import '@testing-library/jest-dom';
import { deserialize, serialize } from 'v8';

// Polyfill structuredClone for fake-indexeddb in jsdom environment
// Uses Node's v8 module for proper structured cloning (handles Date, Map, Set, etc.)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => deserialize(serialize(value));
}

// Polyfill PointerEvent for jsdom, which doesn't implement it at all.
// Without this, fireEvent.pointerDown/Move/Up create a plain Event with
// clientX/clientY assigned onto it, and React's synthetic pointer-event
// system never surfaces those fields on e.clientX in the handler.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent implements PointerEvent {
    readonly pointerId: number;
    readonly width: number;
    readonly height: number;
    readonly pressure: number;
    readonly tangentialPressure: number;
    readonly tiltX: number;
    readonly tiltY: number;
    readonly twist: number;
    readonly altitudeAngle: number;
    readonly azimuthAngle: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.altitudeAngle = params.altitudeAngle ?? 0;
      this.azimuthAngle = params.azimuthAngle ?? 0;
      this.pointerType = params.pointerType ?? '';
      this.isPrimary = params.isPrimary ?? false;
    }

    getCoalescedEvents(): PointerEvent[] {
      return [];
    }

    getPredictedEvents(): PointerEvent[] {
      return [];
    }
  }

  // Justified assertion: jsdom's lib.dom.d.ts types window.PointerEvent as the
  // real PointerEvent constructor; our polyfill implements that interface but
  // TS can't verify it matches the (unavailable) native constructor's shape.
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
