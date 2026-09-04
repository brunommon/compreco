import { Product, ProductInput, Session } from '../types';
import { calcularPrecoUnidadeBase } from '../domain/units';
import { gerarId } from '../lib/id';
import { Storage } from './types';

export class InMemoryStorage implements Storage {
  private sessions: Session[] = [];
  private products: Product[] = [];

  async createSession(categoria: string): Promise<Session> {
    const session: Session = { id: gerarId(), categoria, criadoEm: new Date().toISOString() };
    this.sessions.push(session);
    return session;
  }

  async listSessions(): Promise<Session[]> {
    return [...this.sessions].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.find((s) => s.id === id) ?? null;
  }

  async addProduct(sessionId: string, input: ProductInput): Promise<Product> {
    const precoUnidadeBase = calcularPrecoUnidadeBase(input.preco, input.quantidade, input.unidade);
    const product: Product = { id: gerarId(), sessionId, ...input, precoUnidadeBase };
    this.products.push(product);
    return product;
  }

  async listProducts(sessionId: string): Promise<Product[]> {
    return this.products.filter((p) => p.sessionId === sessionId);
  }

  async deleteProduct(id: string): Promise<void> {
    this.products = this.products.filter((p) => p.id !== id);
  }

  async deleteSession(id: string): Promise<void> {
    this.products = this.products.filter((p) => p.sessionId !== id);
    this.sessions = this.sessions.filter((s) => s.id !== id);
  }
}
