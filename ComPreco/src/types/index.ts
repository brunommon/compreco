export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'un';

export interface Session {
  id: string;
  categoria: string;
  criadoEm: string;
}

export interface Product {
  id: string;
  sessionId: string;
  nome: string;
  preco: number;
  quantidade: number;
  unidade: Unit;
  precoUnidadeBase: number;
}

export interface ProductInput {
  nome: string;
  preco: number;
  quantidade: number;
  unidade: Unit;
}
