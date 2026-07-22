import { Product } from '../types';

/** Ordena produtos do melhor custo-benefício (menor preço/unidade base) pro pior. */
export function ordenarPorMelhorPreco(produtos: Product[]): Product[] {
  return [...produtos].sort((a, b) => a.precoUnidadeBase - b.precoUnidadeBase);
}
