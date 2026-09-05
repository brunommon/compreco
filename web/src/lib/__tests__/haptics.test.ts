import { vibrar } from '../haptics';

describe('vibrar', () => {
  it('chama navigator.vibrate quando disponível', () => {
    const vibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });

    vibrar(20);

    expect(vibrate).toHaveBeenCalledWith(20);
  });

  it('não lança erro quando navigator.vibrate não existe', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(() => vibrar()).not.toThrow();
  });
});
