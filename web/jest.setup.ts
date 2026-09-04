import '@testing-library/jest-dom';

// Polyfill structuredClone for fake-indexeddb in jsdom environment
if (typeof structuredClone === 'undefined') {
  (global as any).structuredClone = (value: any) => JSON.parse(JSON.stringify(value));
}
