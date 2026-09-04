import { ordenarPorMelhorPreco } from '../ranking';
import { Product } from '../../types';

function criarProduto(overrides: Partial<Product>): Product {
  return {
    id: '1',
    sessionId: 's1',
    nome: 'produto',
    preco: 10,
    quantidade: 1,
    unidade: 'kg',
    precoUnidadeBase: 10,
    ...overrides,
  };
}

describe('ordenarPorMelhorPreco', () => {
  it('deve ordenar produtos por menor preço_unidade_base primeiro', () => {
    const produtos = [
      criarProduto({ id: 'a', precoUnidadeBase: 15 }),
      criarProduto({ id: 'b', precoUnidadeBase: 8 }),
      criarProduto({ id: 'c', precoUnidadeBase: 20 }),
    ];

    const resultado = ordenarPorMelhorPreco(produtos);

    expect(resultado.map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });

  it('deve retornar lista vazia quando não há produtos', () => {
    expect(ordenarPorMelhorPreco([])).toEqual([]);
  });

  it('deve não mutar o array original', () => {
    const produtos = [criarProduto({ id: 'a', precoUnidadeBase: 15 }), criarProduto({ id: 'b', precoUnidadeBase: 8 })];
    const original = [...produtos];

    ordenarPorMelhorPreco(produtos);

    expect(produtos).toEqual(original);
  });
});
