import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Product, ProductInput, Session } from '../types';
import { calcularPrecoUnidadeBase } from '../domain/units';
import { gerarId } from '../lib/id';
import { Storage } from './types';

interface ComPrecoDB extends DBSchema {
  sessions: { key: string; value: Session };
  products: { key: string; value: Product; indexes: { sessionId: string } };
}

export class IndexedDbStorage implements Storage {
  private constructor(private db: IDBPDatabase<ComPrecoDB>) {}

  static async open(): Promise<IndexedDbStorage> {
    const db = await openDB<ComPrecoDB>('compreco', 1, {
      upgrade(db) {
        db.createObjectStore('sessions', { keyPath: 'id' });
        const products = db.createObjectStore('products', { keyPath: 'id' });
        products.createIndex('sessionId', 'sessionId');
      },
    });
    return new IndexedDbStorage(db);
  }

  async createSession(categoria: string): Promise<Session> {
    const session: Session = { id: gerarId(), categoria, criadoEm: new Date().toISOString() };
    await this.db.put('sessions', session);
    return session;
  }

  async listSessions(): Promise<Session[]> {
    const sessions = await this.db.getAll('sessions');
    return sessions.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async getSession(id: string): Promise<Session | null> {
    const session = await this.db.get('sessions', id);
    return session ?? null;
  }

  async addProduct(sessionId: string, input: ProductInput): Promise<Product> {
    const precoUnidadeBase = calcularPrecoUnidadeBase(input.preco, input.quantidade, input.unidade);
    const product: Product = { id: gerarId(), sessionId, ...input, precoUnidadeBase };
    await this.db.put('products', product);
    return product;
  }

  async listProducts(sessionId: string): Promise<Product[]> {
    return this.db.getAllFromIndex('products', 'sessionId', sessionId);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete('products', id);
  }

  async deleteSession(id: string): Promise<void> {
    const produtos = await this.listProducts(id);
    await Promise.all(produtos.map((p) => this.db.delete('products', p.id)));
    await this.db.delete('sessions', id);
  }
}
