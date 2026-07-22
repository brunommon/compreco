import { Unit } from '../types';

/** Unidade base de comparação (kg, L ou un) pra cada tipo de unidade de entrada. */
export function unidadeBase(unidade: Unit): 'kg' | 'L' | 'un' {
  switch (unidade) {
    case 'g':
    case 'kg':
      return 'kg';
    case 'ml':
    case 'L':
      return 'L';
    case 'un':
      return 'un';
  }
}

/** Converte a quantidade informada pra unidade base (kg, L ou un). */
export function normalizarQuantidade(quantidade: number, unidade: Unit): number {
  switch (unidade) {
    case 'g':
      return quantidade / 1000;
    case 'kg':
      return quantidade;
    case 'ml':
      return quantidade / 1000;
    case 'L':
      return quantidade;
    case 'un':
      return quantidade;
  }
}

/** Preço por unidade base — a métrica usada pra ranquear produtos. */
export function calcularPrecoUnidadeBase(preco: number, quantidade: number, unidade: Unit): number {
  const quantidadeNormalizada = normalizarQuantidade(quantidade, unidade);
  return preco / quantidadeNormalizada;
}
