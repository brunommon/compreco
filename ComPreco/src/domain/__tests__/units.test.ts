import { unidadeBase, normalizarQuantidade, calcularPrecoUnidadeBase } from '../units';

describe('unidadeBase', () => {
  it('deve retornar kg quando unidade é g', () => {
    expect(unidadeBase('g')).toBe('kg');
  });

  it('deve retornar kg quando unidade é kg', () => {
    expect(unidadeBase('kg')).toBe('kg');
  });

  it('deve retornar L quando unidade é ml', () => {
    expect(unidadeBase('ml')).toBe('L');
  });

  it('deve retornar L quando unidade é L', () => {
    expect(unidadeBase('L')).toBe('L');
  });

  it('deve retornar un quando unidade é un', () => {
    expect(unidadeBase('un')).toBe('un');
  });
});

describe('normalizarQuantidade', () => {
  it('deve converter g pra kg dividindo por 1000', () => {
    expect(normalizarQuantidade(500, 'g')).toBe(0.5);
  });

  it('deve converter ml pra L dividindo por 1000', () => {
    expect(normalizarQuantidade(750, 'ml')).toBe(0.75);
  });

  it('deve manter valor direto quando unidade já é kg', () => {
    expect(normalizarQuantidade(2, 'kg')).toBe(2);
  });

  it('deve manter valor direto quando unidade já é L', () => {
    expect(normalizarQuantidade(1.5, 'L')).toBe(1.5);
  });

  it('deve manter valor direto quando unidade é un', () => {
    expect(normalizarQuantidade(12, 'un')).toBe(12);
  });
});

describe('calcularPrecoUnidadeBase', () => {
  it('deve calcular preço por unidade base corretamente', () => {
    expect(calcularPrecoUnidadeBase(10, 500, 'g')).toBe(20);
  });

  it('deve calcular preço por litro corretamente', () => {
    expect(calcularPrecoUnidadeBase(6, 500, 'ml')).toBe(12);
  });

  it('deve calcular preço por unidade (un) corretamente', () => {
    expect(calcularPrecoUnidadeBase(24, 12, 'un')).toBe(2);
  });

  it('deve lançar erro quando quantidade é zero', () => {
    expect(() => calcularPrecoUnidadeBase(10, 0, 'kg')).toThrow('quantidade deve ser maior que zero');
  });

  it('deve lançar erro quando quantidade é negativa', () => {
    expect(() => calcularPrecoUnidadeBase(10, -5, 'kg')).toThrow('quantidade deve ser maior que zero');
  });
});
