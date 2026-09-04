import '@testing-library/jest-dom';
import { deserialize, serialize } from 'v8';

// Polyfill structuredClone for fake-indexeddb in jsdom environment
// Uses Node's v8 module for proper structured cloning (handles Date, Map, Set, etc.)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => deserialize(serialize(value));
}
