import * as SQLite from 'expo-sqlite';
import { Product, ProductInput, Session, Unit } from '../types';
import { calcularPrecoUnidadeBase } from '../domain/units';
import { Storage } from './types';

function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

interface SessionRow {
  id: string;
  categoria: string;
  criado_em: string;
}

interface ProductRow {
  id: string;
  session_id: string;
  nome: string;
  preco: number;
  quantidade: number;
  unidade: string;
  preco_unidade_base: number;
}

function sessionFromRow(row: SessionRow): Session {
  return { id: row.id, categoria: row.categoria, criadoEm: row.criado_em };
}

function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    sessionId: row.session_id,
    nome: row.nome,
    preco: row.preco,
    quantidade: row.quantidade,
    // valor vem do SQLite como texto livre — só gravamos via addProduct, então é seguro
    unidade: row.unidade as Unit,
    precoUnidadeBase: row.preco_unidade_base,
  };
}

export class SqliteStorage implements Storage {
  private constructor(private db: SQLite.SQLiteDatabase) {}

  static async open(): Promise<SqliteStorage> {
    const db = await SQLite.openDatabaseAsync('compreco.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        categoria TEXT NOT NULL,
        criado_em TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        nome TEXT NOT NULL,
        preco REAL NOT NULL,
        quantidade REAL NOT NULL,
        unidade TEXT NOT NULL,
        preco_unidade_base REAL NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      );
    `);
    return new SqliteStorage(db);
  }

  async createSession(categoria: string): Promise<Session> {
    const session: Session = { id: gerarId(), categoria, criadoEm: new Date().toISOString() };
    await this.db.runAsync(
      'INSERT INTO sessions (id, categoria, criado_em) VALUES (?, ?, ?)',
      session.id,
      session.categoria,
      session.criadoEm
    );
    return session;
  }

  async listSessions(): Promise<Session[]> {
    const rows = await this.db.getAllAsync<SessionRow>(
      'SELECT id, categoria, criado_em FROM sessions ORDER BY criado_em DESC'
    );
    return rows.map(sessionFromRow);
  }

  async getSession(id: string): Promise<Session | null> {
    const row = await this.db.getFirstAsync<SessionRow>(
      'SELECT id, categoria, criado_em FROM sessions WHERE id = ?',
      id
    );
    return row ? sessionFromRow(row) : null;
  }

  async addProduct(sessionId: string, input: ProductInput): Promise<Product> {
    const precoUnidadeBase = calcularPrecoUnidadeBase(input.preco, input.quantidade, input.unidade);
    const product: Product = { id: gerarId(), sessionId, ...input, precoUnidadeBase };
    await this.db.runAsync(
      'INSERT INTO products (id, session_id, nome, preco, quantidade, unidade, preco_unidade_base) VALUES (?, ?, ?, ?, ?, ?, ?)',
      product.id,
      product.sessionId,
      product.nome,
      product.preco,
      product.quantidade,
      product.unidade,
      product.precoUnidadeBase
    );
    return product;
  }

  async listProducts(sessionId: string): Promise<Product[]> {
    const rows = await this.db.getAllAsync<ProductRow>(
      'SELECT id, session_id, nome, preco, quantidade, unidade, preco_unidade_base FROM products WHERE session_id = ?',
      sessionId
    );
    return rows.map(productFromRow);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.runAsync('DELETE FROM products WHERE id = ?', id);
  }
}
