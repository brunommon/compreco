import { gerarId } from '../id';

describe('gerarId', () => {
  it('gera ids diferentes em chamadas sucessivas', () => {
    const a = gerarId();
    const b = gerarId();
    expect(a).not.toBe(b);
  });

  it('gera id não vazio contendo separador "-"', () => {
    expect(gerarId()).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
  });
});
