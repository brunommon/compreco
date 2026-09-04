import { Product, ProductInput, Session } from '../types';

/** Contrato de persistência — implementado por InMemoryStorage (testes/fallback) e IndexedDbStorage (produção). */
export interface Storage {
  createSession(categoria: string): Promise<Session>;
  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  addProduct(sessionId: string, input: ProductInput): Promise<Product>;
  listProducts(sessionId: string): Promise<Product[]>;
  deleteProduct(id: string): Promise<void>;
  /** Apaga a sessão e todos os produtos vinculados a ela (cascade). */
  deleteSession(id: string): Promise<void>;
}
