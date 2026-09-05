export function vibrar(duracaoMs = 15): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(duracaoMs);
  }
}
