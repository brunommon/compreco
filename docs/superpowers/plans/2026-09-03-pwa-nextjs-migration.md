# Migração ComPreco para PWA (Next.js + Vercel) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescrever o app ComPreco (hoje Expo/React Native, só iOS, expira a cada ~7 dias) como um PWA em Next.js, publicado na Vercel, funcionando em qualquer navegador, instalável e offline, com interface mobile-first de verdade (não desktop encolhido).

**Architecture:** Novo projeto Next.js (App Router) em `web/`, ao lado do app Expo atual (que continua rodando em paralelo até o PWA cobrir as mesmas telas). Dado 100% local via IndexedDB, sem backend, sem login. A camada de regra de negócio (`domain/`) e o state (`store/`) migram quase sem alteração do app atual — só a camada de persistência (SQLite → IndexedDB) e as telas (React Native → React web) são reescritas.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Zustand, `idb` (IndexedDB), Serwist (`@serwist/next`, service worker + manifest), Jest + Testing Library (`@testing-library/react`), `fake-indexeddb` (testes de storage).

**Spec:** `docs/superpowers/specs/2026-09-03-pwa-nextjs-migration-design.md`

## Global Constraints

- Dado só local (IndexedDB no navegador) — nunca adicionar chamada de rede pra ler/gravar sessão ou produto; sem login, sem conta, sem sync entre aparelhos
- PWA instalável e funcional offline — service worker obrigatório (via Serwist), não opcional
- Mobile-first de verdade: navegação por barra inferior (bottom nav), não menu lateral; desktop só precisa "não quebrar" — sem layout dedicado
- Cobertura de teste: 80% geral; lógica de normalização/ranking (`src/domain`) mira 95%; mocks restritos à camada de storage nos testes de componente, lógica de cálculo nunca mockada
- Sem variável de ambiente obrigatória (sem backend, sem chave de API)
- Todos os comandos deste plano rodam dentro da pasta `web/`, exceto o Task 1 (que cria essa pasta a partir da raiz do repositório)

---

### Task 1: Scaffold do projeto Next.js

**Files:**
- Create: `web/` (via `create-next-app`)
- Create: `web/jest.config.js`
- Create: `web/jest.setup.ts`
- Modify: `web/package.json` (script `test`)

**Interfaces:**
- Produces: projeto Next.js compilável (`npm run build`) e `npm test` funcionando (sem testes ainda, `--passWithNoTests`)

- [ ] **Step 1: Criar o projeto Next.js**

Rodar na raiz do repositório (`/Users/bmondin/Dev/ComPreco`):

```bash
npx create-next-app@latest web --typescript --eslint --tailwind --app --src-dir --import-alias "@/*" --use-npm
```

Nota: vamos manter import relativo (`../`) no código, igual ao app Expo atual, em vez do alias `@/*` — segue o padrão já usado no código que estamos portando. O alias fica disponível mas não é usado.

- [ ] **Step 2: Instalar dependências de produção e de teste**

```bash
cd web
npm install idb serwist @serwist/next
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest fake-indexeddb
```

- [ ] **Step 3: Configurar Jest**

`web/jest.config.js`:

```js
const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

module.exports = createJestConfig(customJestConfig);
```

`web/jest.setup.ts`:

```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Adicionar script de teste**

Em `web/package.json`, dentro de `"scripts"`, adicionar:

```json
"test": "jest"
```

- [ ] **Step 5: Verificar que o scaffold compila e o Jest está funcionando**

```bash
npm run build
npm test -- --passWithNoTests
```

Esperado: os dois comandos terminam sem erro.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "chore(web): scaffold do projeto Next.js com Jest e Testing Library"
```

---

### Task 2: Portar camada de domínio (types, ranking, unidades, validação)

**Files:**
- Create: `web/src/types/index.ts`
- Create: `web/src/domain/units.ts`
- Create: `web/src/domain/ranking.ts`
- Create: `web/src/domain/validation.ts`
- Test: `web/src/domain/__tests__/units.test.ts`
- Test: `web/src/domain/__tests__/ranking.test.ts`
- Test: `web/src/domain/__tests__/validation.test.ts`

**Interfaces:**
- Produces:
  - `type Unit = 'g' | 'kg' | 'ml' | 'L' | 'un'`
  - `interface Session { id: string; categoria: string; criadoEm: string }`
  - `interface Product { id: string; sessionId: string; nome: string; preco: number; quantidade: number; unidade: Unit; precoUnidadeBase: number }`
  - `interface ProductInput { nome: string; preco: number; quantidade: number; unidade: Unit }`
  - `unidadeBase(unidade: Unit): 'kg' | 'L' | 'un'`
  - `normalizarQuantidade(quantidade: number, unidade: Unit): number`
  - `calcularPrecoUnidadeBase(preco: number, quantidade: number, unidade: Unit): number` (lança erro se `quantidade <= 0`)
  - `ordenarPorMelhorPreco(produtos: Product[]): Product[]`
  - `interface ValidationError { campo: string; mensagem: string }`
  - `validarProduto(input: { nome: string; preco: number; quantidade: number }): ValidationError[]`
  - `validarCategoria(categoria: string): ValidationError[]`

Este código é lógica pura, sem dependência de React Native — migra sem alteração do app Expo atual (`ComPreco/src/types/index.ts` e `ComPreco/src/domain/*`).

- [ ] **Step 1: Copiar `types/index.ts`**

`web/src/types/index.ts`:

```ts
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
```

- [ ] **Step 2: Escrever os testes de `units.ts` (falhando)**

`web/src/domain/__tests__/units.test.ts`:

```ts
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
```

- [ ] **Step 3: Rodar e confirmar falha**

```bash
npx jest src/domain/__tests__/units.test.ts
```

Esperado: FAIL — `Cannot find module '../units'`.

- [ ] **Step 4: Implementar `units.ts`**

`web/src/domain/units.ts`:

```ts
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
  if (!(quantidade > 0)) {
    throw new Error('quantidade deve ser maior que zero');
  }
  const quantidadeNormalizada = normalizarQuantidade(quantidade, unidade);
  return preco / quantidadeNormalizada;
}
```

- [ ] **Step 5: Rodar e confirmar sucesso**

```bash
npx jest src/domain/__tests__/units.test.ts
```

Esperado: PASS (17 testes).

- [ ] **Step 6: Escrever os testes de `ranking.ts` (falhando)**

`web/src/domain/__tests__/ranking.test.ts`:

```ts
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
```

- [ ] **Step 7: Rodar, confirmar falha, implementar `ranking.ts`, confirmar sucesso**

```bash
npx jest src/domain/__tests__/ranking.test.ts
```

Esperado (antes de implementar): FAIL — módulo não encontrado.

`web/src/domain/ranking.ts`:

```ts
import { Product } from '../types';

/** Ordena produtos do melhor custo-benefício (menor preço/unidade base) pro pior. */
export function ordenarPorMelhorPreco(produtos: Product[]): Product[] {
  return [...produtos].sort((a, b) => a.precoUnidadeBase - b.precoUnidadeBase);
}
```

```bash
npx jest src/domain/__tests__/ranking.test.ts
```

Esperado: PASS (3 testes).

- [ ] **Step 8: Escrever os testes de `validation.ts` (falhando)**

`web/src/domain/__tests__/validation.test.ts`:

```ts
import { validarProduto, validarCategoria } from '../validation';

describe('validarProduto', () => {
  it('deve retornar lista vazia quando produto é válido', () => {
    expect(validarProduto({ nome: 'Arroz', preco: 10, quantidade: 1 })).toEqual([]);
  });

  it('deve retornar erro quando preço é zero', () => {
    const erros = validarProduto({ nome: 'Arroz', preco: 0, quantidade: 1 });
    expect(erros).toEqual([{ campo: 'preco', mensagem: 'preço deve ser maior que zero' }]);
  });

  it('deve retornar erro quando preço é negativo', () => {
    const erros = validarProduto({ nome: 'Arroz', preco: -5, quantidade: 1 });
    expect(erros).toContainEqual({ campo: 'preco', mensagem: 'preço deve ser maior que zero' });
  });

  it('deve retornar erro quando quantidade é zero', () => {
    const erros = validarProduto({ nome: 'Arroz', preco: 10, quantidade: 0 });
    expect(erros).toEqual([{ campo: 'quantidade', mensagem: 'quantidade deve ser maior que zero' }]);
  });

  it('deve retornar erro quando nome é vazio', () => {
    const erros = validarProduto({ nome: '', preco: 10, quantidade: 1 });
    expect(erros).toEqual([{ campo: 'nome', mensagem: 'nome é obrigatório' }]);
  });

  it('deve retornar múltiplos erros quando múltiplos campos são inválidos', () => {
    const erros = validarProduto({ nome: '', preco: 0, quantidade: 0 });
    expect(erros).toHaveLength(3);
  });
});

describe('validarCategoria', () => {
  it('deve retornar lista vazia quando categoria é válida', () => {
    expect(validarCategoria('Arroz')).toEqual([]);
  });

  it('deve retornar erro quando categoria é vazia', () => {
    expect(validarCategoria('')).toEqual([{ campo: 'categoria', mensagem: 'categoria é obrigatória' }]);
  });

  it('deve retornar erro quando categoria só tem espaços', () => {
    expect(validarCategoria('   ')).toEqual([{ campo: 'categoria', mensagem: 'categoria é obrigatória' }]);
  });
});
```

- [ ] **Step 9: Rodar, confirmar falha, implementar `validation.ts`, confirmar sucesso**

```bash
npx jest src/domain/__tests__/validation.test.ts
```

Esperado (antes de implementar): FAIL — módulo não encontrado.

`web/src/domain/validation.ts`:

```ts
export interface ValidationError {
  campo: string;
  mensagem: string;
}

export function validarProduto(input: { nome: string; preco: number; quantidade: number }): ValidationError[] {
  const erros: ValidationError[] = [];

  if (!input.nome || input.nome.trim().length === 0) {
    erros.push({ campo: 'nome', mensagem: 'nome é obrigatório' });
  }
  if (!(input.preco > 0)) {
    erros.push({ campo: 'preco', mensagem: 'preço deve ser maior que zero' });
  }
  if (!(input.quantidade > 0)) {
    erros.push({ campo: 'quantidade', mensagem: 'quantidade deve ser maior que zero' });
  }

  return erros;
}

export function validarCategoria(categoria: string): ValidationError[] {
  if (!categoria || categoria.trim().length === 0) {
    return [{ campo: 'categoria', mensagem: 'categoria é obrigatória' }];
  }
  return [];
}
```

```bash
npx jest src/domain/__tests__/validation.test.ts
```

Esperado: PASS (9 testes).

- [ ] **Step 10: Commit**

```bash
git add src/types src/domain
git commit -m "feat(domain): portar types, ranking, unidades e validação do app Expo"
```

---

### Task 3: Portar contrato de storage, storage em memória e util de id

**Files:**
- Create: `web/src/lib/id.ts`
- Test: `web/src/lib/__tests__/id.test.ts`
- Create: `web/src/db/types.ts`
- Create: `web/src/db/in-memory-storage.ts`
- Test: `web/src/db/__tests__/in-memory-storage.test.ts`

**Interfaces:**
- Consumes: `Product`, `ProductInput`, `Session` de `../types` (Task 2); `calcularPrecoUnidadeBase` de `../domain/units` (Task 2)
- Produces:
  - `gerarId(): string`
  - `interface Storage { createSession(categoria: string): Promise<Session>; listSessions(): Promise<Session[]>; getSession(id: string): Promise<Session | null>; addProduct(sessionId: string, input: ProductInput): Promise<Product>; listProducts(sessionId: string): Promise<Product[]>; deleteProduct(id: string): Promise<void>; deleteSession(id: string): Promise<void>; }`
  - `class InMemoryStorage implements Storage`

Nota: no app Expo atual, `gerarId` estava duplicado em `sqlite-storage.ts`. Como vamos ter dois storages novos (`in-memory-storage.ts` e `indexeddb-storage.ts` no Task 4), extraímos pra `lib/id.ts` uma vez só — evita duplicar de novo.

- [ ] **Step 1: Escrever teste de `gerarId` (falhando)**

`web/src/lib/__tests__/id.test.ts`:

```ts
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
```

- [ ] **Step 2: Rodar, confirmar falha, implementar, confirmar sucesso**

```bash
npx jest src/lib/__tests__/id.test.ts
```

Esperado (antes): FAIL — módulo não encontrado.

`web/src/lib/id.ts`:

```ts
export function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
```

```bash
npx jest src/lib/__tests__/id.test.ts
```

Esperado: PASS (2 testes).

- [ ] **Step 3: Copiar o contrato `Storage`**

`web/src/db/types.ts`:

```ts
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
```

- [ ] **Step 4: Escrever os testes de `InMemoryStorage` (falhando)**

`web/src/db/__tests__/in-memory-storage.test.ts`:

```ts
import { InMemoryStorage } from '../in-memory-storage';

describe('InMemoryStorage', () => {
  it('deve persistir sessão e recuperar por id', async () => {
    const storage = new InMemoryStorage();
    const criada = await storage.createSession('arroz');

    const encontrada = await storage.getSession(criada.id);

    expect(encontrada).toEqual(criada);
  });

  it('deve retornar null quando sessão não existe', async () => {
    const storage = new InMemoryStorage();
    expect(await storage.getSession('inexistente')).toBeNull();
  });

  it('deve listar sessões ordenadas por data de criação desc', async () => {
    const storage = new InMemoryStorage();
    const primeira = await storage.createSession('arroz');
    await new Promise((r) => setTimeout(r, 2));
    const segunda = await storage.createSession('feijão');

    const lista = await storage.listSessions();

    expect(lista.map((s) => s.id)).toEqual([segunda.id, primeira.id]);
  });

  it('deve persistir produto vinculado à sessão e calcular preço_unidade_base', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');

    const produto = await storage.addProduct(sessao.id, {
      nome: 'Arroz 5kg',
      preco: 25,
      quantidade: 5,
      unidade: 'kg',
    });

    expect(produto.sessionId).toBe(sessao.id);
    expect(produto.precoUnidadeBase).toBe(5);
  });

  it('deve listar produtos apenas da sessão informada', async () => {
    const storage = new InMemoryStorage();
    const sessaoA = await storage.createSession('arroz');
    const sessaoB = await storage.createSession('feijão');
    await storage.addProduct(sessaoA.id, { nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg' });
    await storage.addProduct(sessaoB.id, { nome: 'Feijão', preco: 8, quantidade: 1, unidade: 'kg' });

    const produtosA = await storage.listProducts(sessaoA.id);

    expect(produtosA).toHaveLength(1);
    expect(produtosA[0]?.nome).toBe('Arroz');
  });

  it('deve deletar produto sem deletar a sessão', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');
    const produto = await storage.addProduct(sessao.id, { nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg' });

    await storage.deleteProduct(produto.id);

    expect(await storage.listProducts(sessao.id)).toEqual([]);
    expect(await storage.getSession(sessao.id)).not.toBeNull();
  });

  it('deve deletar sessão e seus produtos (cascade)', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');
    await storage.addProduct(sessao.id, { nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg' });

    await storage.deleteSession(sessao.id);

    expect(await storage.getSession(sessao.id)).toBeNull();
    expect(await storage.listProducts(sessao.id)).toEqual([]);
  });

  it('deve deletar apenas a sessão informada, mantendo as outras', async () => {
    const storage = new InMemoryStorage();
    const sessaoA = await storage.createSession('arroz');
    const sessaoB = await storage.createSession('feijão');

    await storage.deleteSession(sessaoA.id);

    expect(await storage.getSession(sessaoA.id)).toBeNull();
    expect(await storage.getSession(sessaoB.id)).not.toBeNull();
  });
});
```

- [ ] **Step 5: Rodar e confirmar falha**

```bash
npx jest src/db/__tests__/in-memory-storage.test.ts
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 6: Implementar `InMemoryStorage`**

`web/src/db/in-memory-storage.ts`:

```ts
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
```

- [ ] **Step 7: Rodar e confirmar sucesso**

```bash
npx jest src/db/__tests__/in-memory-storage.test.ts
```

Esperado: PASS (8 testes).

- [ ] **Step 8: Commit**

```bash
git add src/lib src/db
git commit -m "feat(db): portar contrato Storage e InMemoryStorage do app Expo"
```

---

### Task 4: Storage IndexedDB (`IndexedDbStorage`)

**Files:**
- Create: `web/src/db/indexeddb-storage.ts`
- Test: `web/src/db/__tests__/indexeddb-storage.test.ts`

**Interfaces:**
- Consumes: `Storage` de `./types` (Task 3); `gerarId` de `../lib/id` (Task 3); `calcularPrecoUnidadeBase` de `../domain/units` (Task 2); `Product`, `ProductInput`, `Session` de `../types` (Task 2); pacote `idb`
- Produces: `class IndexedDbStorage implements Storage` com `static async open(): Promise<IndexedDbStorage>`

- [ ] **Step 1: Escrever os testes (falhando)**

`web/src/db/__tests__/indexeddb-storage.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { IndexedDbStorage } from '../indexeddb-storage';

describe('IndexedDbStorage', () => {
  it('persiste sessão e recupera por id', async () => {
    const storage = await IndexedDbStorage.open();
    const criada = await storage.createSession('arroz');

    const encontrada = await storage.getSession(criada.id);

    expect(encontrada).toEqual(criada);
  });

  it('persiste produto vinculado à sessão e calcula preço_unidade_base', async () => {
    const storage = await IndexedDbStorage.open();
    const sessao = await storage.createSession('arroz');

    const produto = await storage.addProduct(sessao.id, { nome: 'Arroz 5kg', preco: 25, quantidade: 5, unidade: 'kg' });

    expect(produto.sessionId).toBe(sessao.id);
    expect(produto.precoUnidadeBase).toBe(5);
  });

  it('lista produtos apenas da sessão informada', async () => {
    const storage = await IndexedDbStorage.open();
    const sessaoA = await storage.createSession('arroz');
    const sessaoB = await storage.createSession('feijão');
    await storage.addProduct(sessaoA.id, { nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg' });
    await storage.addProduct(sessaoB.id, { nome: 'Feijão', preco: 8, quantidade: 1, unidade: 'kg' });

    const produtosA = await storage.listProducts(sessaoA.id);

    expect(produtosA).toHaveLength(1);
    expect(produtosA[0]?.nome).toBe('Arroz');
  });

  it('deleta sessão e seus produtos (cascade)', async () => {
    const storage = await IndexedDbStorage.open();
    const sessao = await storage.createSession('arroz');
    await storage.addProduct(sessao.id, { nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg' });

    await storage.deleteSession(sessao.id);

    expect(await storage.getSession(sessao.id)).toBeNull();
    expect(await storage.listProducts(sessao.id)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/db/__tests__/indexeddb-storage.test.ts
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `IndexedDbStorage`**

`web/src/db/indexeddb-storage.ts`:

```ts
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
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/db/__tests__/indexeddb-storage.test.ts
```

Esperado: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/db/indexeddb-storage.ts src/db/__tests__/indexeddb-storage.test.ts
git commit -m "feat(db): implementar IndexedDbStorage com idb"
```

---

### Task 5: Storage provider (com fallback pra memória)

**Files:**
- Create: `web/src/db/storage-provider.ts`
- Test: `web/src/db/__tests__/storage-provider.test.ts`

**Interfaces:**
- Consumes: `IndexedDbStorage` de `./indexeddb-storage` (Task 4); `InMemoryStorage` de `./in-memory-storage` (Task 3); `Storage` de `./types` (Task 3)
- Produces: `getStorage(): Promise<Storage>` (singleton, memoiza a instância); `resetStorageForTests(): void`

Esta é a camada usada pelas telas — cobre o requisito da spec de "falha de IndexedDB → toast + fallback pra memória" na parte de detecção; o toast em si é responsabilidade da tela (Task 8/9/11 tratam o `catch`).

- [ ] **Step 1: Escrever os testes (falhando)**

`web/src/db/__tests__/storage-provider.test.ts`:

```ts
import { InMemoryStorage } from '../in-memory-storage';

jest.mock('../indexeddb-storage', () => ({
  IndexedDbStorage: { open: jest.fn() },
}));

import { IndexedDbStorage } from '../indexeddb-storage';
import { getStorage, resetStorageForTests } from '../storage-provider';

describe('getStorage', () => {
  beforeEach(() => {
    resetStorageForTests();
    jest.clearAllMocks();
  });

  it('usa IndexedDbStorage quando abre com sucesso', async () => {
    const fake = new InMemoryStorage();
    (IndexedDbStorage.open as jest.Mock).mockResolvedValue(fake);

    const storage = await getStorage();

    expect(storage).toBe(fake);
  });

  it('cai pra InMemoryStorage quando IndexedDbStorage falha ao abrir', async () => {
    (IndexedDbStorage.open as jest.Mock).mockRejectedValue(new Error('sem suporte'));

    const storage = await getStorage();

    expect(storage).toBeInstanceOf(InMemoryStorage);
  });

  it('reaproveita a mesma instância em chamadas subsequentes', async () => {
    const fake = new InMemoryStorage();
    (IndexedDbStorage.open as jest.Mock).mockResolvedValue(fake);

    const primeira = await getStorage();
    const segunda = await getStorage();

    expect(primeira).toBe(segunda);
    expect(IndexedDbStorage.open).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/db/__tests__/storage-provider.test.ts
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `storage-provider.ts`**

`web/src/db/storage-provider.ts`:

```ts
import { Storage } from './types';
import { InMemoryStorage } from './in-memory-storage';
import { IndexedDbStorage } from './indexeddb-storage';

let storagePromise: Promise<Storage> | null = null;

export function getStorage(): Promise<Storage> {
  if (!storagePromise) {
    storagePromise = IndexedDbStorage.open().catch((erro) => {
      console.error('IndexedDB indisponível, usando storage em memória', erro);
      return new InMemoryStorage();
    });
  }
  return storagePromise;
}

/** Só pra teste: força recriar a promise entre casos. */
export function resetStorageForTests(): void {
  storagePromise = null;
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/db/__tests__/storage-provider.test.ts
```

Esperado: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/db/storage-provider.ts src/db/__tests__/storage-provider.test.ts
git commit -m "feat(db): storage provider com fallback pra memória quando IndexedDB falha"
```

---

### Task 6: Portar store de sessão (Zustand)

**Files:**
- Create: `web/src/store/session-store.ts`
- Test: `web/src/store/__tests__/session-store.test.ts`

**Interfaces:**
- Consumes: `Storage` de `../db/types` (Task 3); `InMemoryStorage` de `../db/in-memory-storage` (Task 3, só no teste); `ordenarPorMelhorPreco` de `../domain/ranking` (Task 2); `Product`, `ProductInput`, `Session` de `../types` (Task 2)
- Produces: hook `useSessionStore` com estado `{ storage: Storage | null; activeSession: Session | null; products: Product[] }` e ações `setStorage(storage: Storage): void`, `loadSession(sessionId: string): Promise<void>`, `addProduct(input: ProductInput): Promise<void>`, `removeProduct(productId: string): Promise<void>`

- [ ] **Step 1: Escrever os testes (falhando)**

`web/src/store/__tests__/session-store.test.ts`:

```ts
import { InMemoryStorage } from '../../db/in-memory-storage';
import { useSessionStore } from '../session-store';

function resetStore() {
  useSessionStore.setState({ storage: null, activeSession: null, products: [] });
}

describe('useSessionStore', () => {
  beforeEach(resetStore);

  it('deve carregar sessão e produtos ordenados por melhor preço', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');
    await storage.addProduct(sessao.id, { nome: 'Caro', preco: 20, quantidade: 1, unidade: 'kg' });
    await storage.addProduct(sessao.id, { nome: 'Barato', preco: 8, quantidade: 1, unidade: 'kg' });

    useSessionStore.getState().setStorage(storage);
    await useSessionStore.getState().loadSession(sessao.id);

    const estado = useSessionStore.getState();
    expect(estado.activeSession?.id).toBe(sessao.id);
    expect(estado.products.map((p) => p.nome)).toEqual(['Barato', 'Caro']);
  });

  it('deve adicionar produto e reordenar lista automaticamente', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');
    useSessionStore.getState().setStorage(storage);
    await useSessionStore.getState().loadSession(sessao.id);

    await useSessionStore.getState().addProduct({ nome: 'Caro', preco: 20, quantidade: 1, unidade: 'kg' });
    await useSessionStore.getState().addProduct({ nome: 'Barato', preco: 8, quantidade: 1, unidade: 'kg' });

    expect(useSessionStore.getState().products.map((p) => p.nome)).toEqual(['Barato', 'Caro']);
  });

  it('deve remover produto da lista', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');
    useSessionStore.getState().setStorage(storage);
    await useSessionStore.getState().loadSession(sessao.id);
    await useSessionStore.getState().addProduct({ nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg' });
    const produtoId = useSessionStore.getState().products[0]?.id;
    if (!produtoId) throw new Error('produto não foi adicionado');

    await useSessionStore.getState().removeProduct(produtoId);

    expect(useSessionStore.getState().products).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/store/__tests__/session-store.test.ts
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Instalar zustand e implementar o store**

```bash
npm install zustand
```

`web/src/store/session-store.ts`:

```ts
import { create } from 'zustand';
import { Product, ProductInput, Session } from '../types';
import { Storage } from '../db/types';
import { ordenarPorMelhorPreco } from '../domain/ranking';

interface SessionState {
  storage: Storage | null;
  activeSession: Session | null;
  products: Product[];
  setStorage: (storage: Storage) => void;
  loadSession: (sessionId: string) => Promise<void>;
  addProduct: (input: ProductInput) => Promise<void>;
  removeProduct: (productId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  storage: null,
  activeSession: null,
  products: [],

  setStorage: (storage) => set({ storage }),

  loadSession: async (sessionId) => {
    const { storage } = get();
    if (!storage) throw new Error('storage não configurado');
    const [session, products] = await Promise.all([
      storage.getSession(sessionId),
      storage.listProducts(sessionId),
    ]);
    set({ activeSession: session, products: ordenarPorMelhorPreco(products) });
  },

  addProduct: async (input) => {
    const { storage, activeSession, products } = get();
    if (!storage || !activeSession) throw new Error('sessão não carregada');
    const product = await storage.addProduct(activeSession.id, input);
    set({ products: ordenarPorMelhorPreco([...products, product]) });
  },

  removeProduct: async (productId) => {
    const { storage, products } = get();
    if (!storage) throw new Error('storage não configurado');
    await storage.deleteProduct(productId);
    set({ products: products.filter((p) => p.id !== productId) });
  },
}));
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/store/__tests__/session-store.test.ts
```

Esperado: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add src/store package.json package-lock.json
git commit -m "feat(store): portar useSessionStore (zustand) do app Expo"
```

---

### Task 7: App shell — layout, navegação inferior, manifesto e service worker

**Files:**
- Create: `web/public/manifest.json`
- Create: `web/public/icon.svg`
- Create: `web/next.config.ts` (substitui o `next.config.js`/`.mjs` gerado no Task 1)
- Create: `web/src/app/sw.ts`
- Create: `web/src/components/bottom-nav.tsx`
- Test: `web/src/components/__tests__/bottom-nav.test.tsx`
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/globals.css`

**Interfaces:**
- Produces: componente `BottomNav` (sem props); root layout com metadata `manifest: '/manifest.json'`

Antes de implementar o service worker, checar a documentação atual do Serwist pra Next.js (`https://serwist.pages.dev/docs/next/getting-started`) — é uma lib que muda API com frequência e o conhecimento usado aqui pode estar desatualizado.

- [ ] **Step 1: Criar manifesto e ícone**

`web/public/manifest.json`:

```json
{
  "name": "ComPreco",
  "short_name": "ComPreco",
  "description": "Compara preço de produtos por unidade de medida",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icon.svg", "sizes": "192x192 512x512", "type": "image/svg+xml", "purpose": "any" }
  ]
}
```

`web/public/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#2563eb"/>
  <text x="256" y="320" font-size="220" font-family="sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">C$</text>
</svg>
```

Nota: ícone provisório (só pra manifesto funcionar e ser instalável). Trocar por arte final depois, sem bloquear o resto do plano.

- [ ] **Step 2: Configurar Serwist**

```bash
npm install serwist @serwist/next
```

`web/next.config.ts`:

```ts
import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig: NextConfig = {};

export default withSerwist(nextConfig);
```

Apagar o `next.config.js` (ou `.mjs`) gerado pelo `create-next-app` no Task 1, pra não conflitar com este.

`web/src/app/sw.ts`:

```ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

- [ ] **Step 3: Escrever teste do `BottomNav` (falhando)**

`web/src/components/__tests__/bottom-nav.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { BottomNav } from '../bottom-nav';

jest.mock('next/navigation', () => ({
  usePathname: () => '/nova',
}));

describe('BottomNav', () => {
  it('marca o link ativo conforme a rota atual', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: 'Nova' })).toHaveClass('font-semibold');
    expect(screen.getByRole('link', { name: 'Histórico' })).not.toHaveClass('font-semibold');
  });
});
```

- [ ] **Step 4: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/bottom-nav.test.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 5: Implementar `BottomNav`**

`web/src/components/bottom-nav.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Histórico' },
  { href: '/nova', label: 'Nova' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-white pb-[env(safe-area-inset-bottom)]">
      {ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-3 text-center text-sm ${active ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 6: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/bottom-nav.test.tsx
```

Esperado: PASS (1 teste).

- [ ] **Step 7: Ligar manifesto e `BottomNav` no layout raiz**

`web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { BottomNav } from '../components/bottom-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComPreco',
  description: 'Compara preço de produtos por unidade de medida',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="pb-16">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
```

Sem teste dedicado pro layout raiz (é composição direta) — fica coberto indiretamente pelos testes de página dos próximos tasks.

- [ ] **Step 8: Verificar build completo**

```bash
npm run build
```

Esperado: build passa, `public/sw.js` é gerado, sem erro de tipo.

- [ ] **Step 9: Commit**

```bash
git add public web/next.config.ts src/app/layout.tsx src/app/sw.ts src/app/globals.css src/components/bottom-nav.tsx src/components/__tests__/bottom-nav.test.tsx package.json package-lock.json
git commit -m "feat(pwa): manifesto, service worker (Serwist) e navegação inferior"
```

---

### Task 8: Tela Histórico (`/`)

**Files:**
- Create: `web/src/components/session-list-item.tsx`
- Test: `web/src/components/__tests__/session-list-item.test.tsx`
- Create: `web/src/app/page.tsx` (substitui o gerado no Task 1)
- Test: `web/src/app/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `Session`, `Product` de `../types` (Task 2); `ordenarPorMelhorPreco` de `../domain/ranking` (Task 2); `getStorage` de `../db/storage-provider` (Task 5)
- Produces: componente `SessionListItem({ session: Session; produtos: Product[] })`; página `HistoricoPage` (default export de `src/app/page.tsx`)

- [ ] **Step 1: Escrever teste do `SessionListItem` (falhando)**

`web/src/components/__tests__/session-list-item.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { SessionListItem } from '../session-list-item';
import { Product, Session } from '../../types';

const session: Session = { id: 's1', categoria: 'Arroz', criadoEm: '2026-09-01T00:00:00.000Z' };

function criarProduto(overrides: Partial<Product>): Product {
  return { id: '1', sessionId: 's1', nome: 'p', preco: 10, quantidade: 1, unidade: 'kg', precoUnidadeBase: 10, ...overrides };
}

describe('SessionListItem', () => {
  it('mostra categoria, quantidade de produtos e melhor preço', () => {
    render(
      <SessionListItem
        session={session}
        produtos={[criarProduto({ id: 'a', precoUnidadeBase: 8 }), criarProduto({ id: 'b', precoUnidadeBase: 15 })]}
      />
    );
    expect(screen.getByText('Arroz')).toBeInTheDocument();
    expect(screen.getByText('2 produtos')).toBeInTheDocument();
    expect(screen.getByText('R$ 8.00')).toBeInTheDocument();
  });

  it('não mostra preço quando não há produtos', () => {
    render(<SessionListItem session={session} produtos={[]} />);
    expect(screen.getByText('0 produtos')).toBeInTheDocument();
    expect(screen.queryByText(/^R\$/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar, confirmar falha, implementar, confirmar sucesso**

```bash
npx jest src/components/__tests__/session-list-item.test.tsx
```

Esperado (antes): FAIL — módulo não encontrado.

`web/src/components/session-list-item.tsx`:

```tsx
import Link from 'next/link';
import { Product, Session } from '../types';
import { ordenarPorMelhorPreco } from '../domain/ranking';

interface SessionListItemProps {
  session: Session;
  produtos: Product[];
}

export function SessionListItem({ session, produtos }: SessionListItemProps) {
  const melhor = ordenarPorMelhorPreco(produtos)[0];
  return (
    <Link href={`/session/${session.id}`} className="flex items-center justify-between border-b p-4">
      <div>
        <p className="font-medium">{session.categoria}</p>
        <p className="text-sm text-gray-500">
          {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
        </p>
      </div>
      {melhor && <p className="text-sm font-semibold text-green-600">R$ {melhor.precoUnidadeBase.toFixed(2)}</p>}
    </Link>
  );
}
```

```bash
npx jest src/components/__tests__/session-list-item.test.tsx
```

Esperado: PASS (2 testes).

- [ ] **Step 3: Escrever teste da página Histórico (falhando)**

`web/src/app/__tests__/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import HistoricoPage from '../page';
import { InMemoryStorage } from '../../db/in-memory-storage';

jest.mock('../../db/storage-provider', () => ({
  getStorage: jest.fn(),
}));

import { getStorage } from '../../db/storage-provider';

describe('HistoricoPage', () => {
  it('mostra estado vazio quando não há sessões', async () => {
    const storage = new InMemoryStorage();
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<HistoricoPage />);

    expect(await screen.findByText(/Nenhuma comparação ainda/)).toBeInTheDocument();
  });

  it('lista sessões existentes', async () => {
    const storage = new InMemoryStorage();
    await storage.createSession('Arroz');
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<HistoricoPage />);

    expect(await screen.findByText('Arroz')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Rodar, confirmar falha, implementar, confirmar sucesso**

```bash
npx jest src/app/__tests__/page.test.tsx
```

Esperado (antes): FAIL.

`web/src/app/page.tsx`:

```tsx
'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStorage } from '../db/storage-provider';
import { Product, Session } from '../types';
import { SessionListItem } from '../components/session-list-item';

export default function HistoricoPage() {
  const [sessoes, setSessoes] = useState<{ session: Session; produtos: Product[] }[] | null>(null);

  useEffect(() => {
    async function carregar() {
      const storage = await getStorage();
      const lista = await storage.listSessions();
      const comProdutos = await Promise.all(
        lista.map(async (session) => ({ session, produtos: await storage.listProducts(session.id) }))
      );
      setSessoes(comProdutos);
    }
    carregar();
  }, []);

  if (sessoes === null) return null;

  return (
    <main>
      {sessoes.length === 0 ? (
        <p className="p-6 text-center text-gray-500">Nenhuma comparação ainda. Toque em &quot;+&quot; pra começar.</p>
      ) : (
        sessoes.map(({ session, produtos }) => <SessionListItem key={session.id} session={session} produtos={produtos} />)
      )}
      <Link
        href="/nova"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg"
        aria-label="Nova comparação"
      >
        +
      </Link>
    </main>
  );
}
```

```bash
npx jest src/app/__tests__/page.test.tsx
```

Esperado: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/components/session-list-item.tsx src/components/__tests__/session-list-item.test.tsx src/app/page.tsx src/app/__tests__/page.test.tsx
git commit -m "feat(historico): listar sessões passadas com melhor preço e estado vazio"
```

---

### Task 9: Tela Nova Sessão (`/nova`)

**Files:**
- Create: `web/src/app/nova/page.tsx`
- Test: `web/src/app/nova/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `validarCategoria` de `../../domain/validation` (Task 2); `getStorage` de `../../db/storage-provider` (Task 5)
- Produces: página `NovaSessaoPage` (default export de `src/app/nova/page.tsx`)

- [ ] **Step 1: Escrever os testes (falhando)**

`web/src/app/nova/__tests__/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NovaSessaoPage from '../page';
import { InMemoryStorage } from '../../../db/in-memory-storage';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('../../../db/storage-provider', () => ({ getStorage: jest.fn() }));

import { getStorage } from '../../../db/storage-provider';

describe('NovaSessaoPage', () => {
  it('mostra erro quando categoria está vazia', async () => {
    render(<NovaSessaoPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }));
    expect(await screen.findByText('categoria é obrigatória')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('cria sessão e navega pra tela da sessão', async () => {
    const storage = new InMemoryStorage();
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<NovaSessaoPage />);
    await userEvent.type(screen.getByLabelText(/Categoria/), 'Arroz');
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }));

    const sessoes = await storage.listSessions();
    expect(sessoes).toHaveLength(1);
    expect(push).toHaveBeenCalledWith(`/session/${sessoes[0].id}`);
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/app/nova/__tests__/page.test.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar a página**

`web/src/app/nova/page.tsx`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { getStorage } from '../../db/storage-provider';
import { validarCategoria } from '../../domain/validation';

export default function NovaSessaoPage() {
  const router = useRouter();
  const [categoria, setCategoria] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const erros = validarCategoria(categoria);
    if (erros.length > 0) {
      setErro(erros[0].mensagem);
      return;
    }
    const storage = await getStorage();
    const sessao = await storage.createSession(categoria.trim());
    router.push(`/session/${sessao.id}`);
  }

  return (
    <main className="p-4">
      <h1 className="mb-4 text-lg font-semibold">Nova comparação</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="categoria" className="mb-1 block text-sm text-gray-600">
          Categoria (ex: arroz)
        </label>
        <input
          id="categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full rounded border p-3 text-base"
        />
        {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
        <button type="submit" className="mt-4 w-full rounded bg-blue-600 p-3 font-semibold text-white">
          Começar
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/app/nova/__tests__/page.test.tsx
```

Esperado: PASS (2 testes).

- [ ] **Step 5: Commit**

```bash
git add src/app/nova
git commit -m "feat(nova-sessao): tela de criação de sessão com validação inline"
```

---

### Task 10: `UnitPicker` e `AddProductForm` (bottom sheet)

**Files:**
- Create: `web/src/components/unit-picker.tsx`
- Test: `web/src/components/__tests__/unit-picker.test.tsx`
- Create: `web/src/components/add-product-form.tsx`
- Test: `web/src/components/__tests__/add-product-form.test.tsx`

**Interfaces:**
- Consumes: `Unit`, `ProductInput` de `../types` (Task 2); `validarProduto` de `../domain/validation` (Task 2)
- Produces:
  - `UnitPicker({ value: Unit; onChange: (unidade: Unit) => void })`
  - `AddProductForm({ onSubmit: (input: ProductInput) => void; onCancel: () => void })`

- [ ] **Step 1: Escrever teste do `UnitPicker` (falhando)**

`web/src/components/__tests__/unit-picker.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitPicker } from '../unit-picker';

describe('UnitPicker', () => {
  it('marca a unidade selecionada e chama onChange ao trocar', async () => {
    const onChange = jest.fn();
    render(<UnitPicker value="kg" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'kg' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'ml' }));

    expect(onChange).toHaveBeenCalledWith('ml');
  });
});
```

- [ ] **Step 2: Rodar, confirmar falha, implementar, confirmar sucesso**

```bash
npx jest src/components/__tests__/unit-picker.test.tsx
```

Esperado (antes): FAIL.

`web/src/components/unit-picker.tsx`:

```tsx
import { Unit } from '../types';

const UNIDADES: Unit[] = ['g', 'kg', 'ml', 'L', 'un'];

interface UnitPickerProps {
  value: Unit;
  onChange: (unidade: Unit) => void;
}

export function UnitPicker({ value, onChange }: UnitPickerProps) {
  return (
    <div className="flex gap-2" role="group" aria-label="Unidade">
      {UNIDADES.map((unidade) => (
        <button
          key={unidade}
          type="button"
          onClick={() => onChange(unidade)}
          aria-pressed={unidade === value}
          className={`rounded-full px-3 py-1 text-sm ${unidade === value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
        >
          {unidade}
        </button>
      ))}
    </div>
  );
}
```

```bash
npx jest src/components/__tests__/unit-picker.test.tsx
```

Esperado: PASS (1 teste).

- [ ] **Step 3: Escrever testes do `AddProductForm` (falhando)**

`web/src/components/__tests__/add-product-form.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProductForm } from '../add-product-form';

describe('AddProductForm', () => {
  it('mostra erro inline e não chama onSubmit quando preço é zero', async () => {
    const onSubmit = jest.fn();
    render(<AddProductForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Produto'), 'Arroz');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '0');
    await userEvent.type(screen.getByLabelText('Quantidade'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('preço deve ser maior que zero')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('chama onSubmit com os dados quando válido', async () => {
    const onSubmit = jest.fn();
    render(<AddProductForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Produto'), 'Arroz 5kg');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '25');
    await userEvent.type(screen.getByLabelText('Quantidade'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'ml' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Arroz 5kg', preco: 25, quantidade: 5, unidade: 'ml' });
  });
});
```

- [ ] **Step 4: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/add-product-form.test.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 5: Implementar `AddProductForm`**

`web/src/components/add-product-form.tsx`:

```tsx
'use client';
import { FormEvent, useState } from 'react';
import { ProductInput, Unit } from '../types';
import { validarProduto } from '../domain/validation';
import { UnitPicker } from './unit-picker';

interface AddProductFormProps {
  onSubmit: (input: ProductInput) => void;
  onCancel: () => void;
}

export function AddProductForm({ onSubmit, onCancel }: AddProductFormProps) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState<Unit>('kg');
  const [erros, setErros] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const input = { nome, preco: Number(preco), quantidade: Number(quantidade) };
    const listaErros = validarProduto(input);
    if (listaErros.length > 0) {
      setErros(Object.fromEntries(listaErros.map((err) => [err.campo, err.mensagem])));
      return;
    }
    onSubmit({ ...input, unidade });
  }

  return (
    <form onSubmit={handleSubmit} className="fixed inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl">
      <label htmlFor="nome" className="mb-1 block text-sm text-gray-600">
        Produto
      </label>
      <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="mb-1 w-full rounded border p-3" />
      {erros.nome && <p className="mb-2 text-sm text-red-600">{erros.nome}</p>}

      <label htmlFor="preco" className="mb-1 block text-sm text-gray-600">
        Preço (R$)
      </label>
      <input
        id="preco"
        inputMode="decimal"
        value={preco}
        onChange={(e) => setPreco(e.target.value)}
        className="mb-1 w-full rounded border p-3"
      />
      {erros.preco && <p className="mb-2 text-sm text-red-600">{erros.preco}</p>}

      <label htmlFor="quantidade" className="mb-1 block text-sm text-gray-600">
        Quantidade
      </label>
      <input
        id="quantidade"
        inputMode="decimal"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
        className="mb-1 w-full rounded border p-3"
      />
      {erros.quantidade && <p className="mb-2 text-sm text-red-600">{erros.quantidade}</p>}

      <UnitPicker value={unidade} onChange={setUnidade} />

      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded border p-3">
          Cancelar
        </button>
        <button type="submit" className="flex-1 rounded bg-blue-600 p-3 font-semibold text-white">
          Salvar
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/add-product-form.test.tsx
```

Esperado: PASS (2 testes).

- [ ] **Step 7: Commit**

```bash
git add src/components/unit-picker.tsx src/components/add-product-form.tsx src/components/__tests__/unit-picker.test.tsx src/components/__tests__/add-product-form.test.tsx
git commit -m "feat(add-produto): formulário em bottom sheet com teclado numérico e validação inline"
```

---

### Task 11: Tela Sessão/Comparação (`/session/[id]`), `ProductCard` com swipe e vibração

**Files:**
- Create: `web/src/lib/haptics.ts`
- Test: `web/src/lib/__tests__/haptics.test.ts`
- Create: `web/src/components/product-card.tsx`
- Test: `web/src/components/__tests__/product-card.test.tsx`
- Create: `web/src/app/session/[id]/page.tsx`
- Test: `web/src/app/session/[id]/__tests__/page.test.tsx`

**Interfaces:**
- Consumes: `Product` de `../types` (Task 2); `useSessionStore` de `../../store/session-store` (Task 6); `getStorage` de `../../db/storage-provider` (Task 5); `AddProductForm` de `../../components/add-product-form` (Task 10); `Storage` de `../../db/types` (Task 3)
- Produces: `vibrar(duracaoMs?: number): void`; `ProductCard({ product: Product; melhor: boolean; onDelete: (id: string) => void })`; página `SessaoPage` (default export)

- [ ] **Step 1: Escrever teste de `vibrar` (falhando)**

`web/src/lib/__tests__/haptics.test.ts`:

```ts
import { vibrar } from '../haptics';

describe('vibrar', () => {
  it('chama navigator.vibrate quando disponível', () => {
    const vibrate = jest.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });

    vibrar(20);

    expect(vibrate).toHaveBeenCalledWith(20);
  });

  it('não lança erro quando navigator.vibrate não existe', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true });
    expect(() => vibrar()).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar, confirmar falha, implementar, confirmar sucesso**

```bash
npx jest src/lib/__tests__/haptics.test.ts
```

Esperado (antes): FAIL.

`web/src/lib/haptics.ts`:

```ts
export function vibrar(duracaoMs = 15): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(duracaoMs);
  }
}
```

```bash
npx jest src/lib/__tests__/haptics.test.ts
```

Esperado: PASS (2 testes).

- [ ] **Step 3: Escrever testes do `ProductCard` (falhando)**

`web/src/components/__tests__/product-card.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '../product-card';
import { Product } from '../../types';

const produto: Product = { id: '1', sessionId: 's1', nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg', precoUnidadeBase: 10 };

describe('ProductCard', () => {
  it('mostra badge de melhor custo quando melhor=true', () => {
    render(<ProductCard product={produto} melhor onDelete={jest.fn()} />);
    expect(screen.getByText('melhor custo')).toBeInTheDocument();
  });

  it('chama onDelete ao clicar no botão remover', async () => {
    const onDelete = jest.fn();
    render(<ProductCard product={produto} melhor={false} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remover Arroz' }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('chama onDelete ao arrastar além do limite de swipe', () => {
    const onDelete = jest.fn();
    const { container } = render(<ProductCard product={produto} melhor={false} onDelete={onDelete} />);
    const card = container.firstChild as HTMLElement;

    fireEvent.pointerDown(card, { clientX: 200 });
    fireEvent.pointerMove(card, { clientX: 100 });
    fireEvent.pointerUp(card);

    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 4: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/product-card.test.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 5: Implementar `ProductCard`**

`web/src/components/product-card.tsx`:

```tsx
'use client';
import { PointerEvent, useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  melhor: boolean;
  onDelete: (id: string) => void;
}

const LIMITE_SWIPE = 80;

export function ProductCard({ product, melhor, onDelete }: ProductCardProps) {
  const [arrastoX, setArrastoX] = useState(0);
  const [inicioX, setInicioX] = useState<number | null>(null);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    setInicioX(e.clientX);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (inicioX === null) return;
    setArrastoX(Math.min(0, e.clientX - inicioX));
  }

  function handlePointerUp() {
    if (arrastoX <= -LIMITE_SWIPE) {
      onDelete(product.id);
    }
    setArrastoX(0);
    setInicioX(null);
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ transform: `translateX(${arrastoX}px)` }}
      className={`flex items-center justify-between border-b p-4 transition-transform ${melhor ? 'bg-green-50' : ''}`}
    >
      <div>
        {melhor && (
          <span className="mb-1 inline-block rounded bg-green-600 px-2 py-0.5 text-xs text-white">melhor custo</span>
        )}
        <p className="font-medium">{product.nome}</p>
        <p className="text-sm text-gray-500">
          R$ {product.preco.toFixed(2)} · {product.quantidade}
          {product.unidade} · R$ {product.precoUnidadeBase.toFixed(2)}/{product.unidade}
        </p>
      </div>
      <button type="button" onClick={() => onDelete(product.id)} aria-label={`Remover ${product.nome}`} className="text-red-600">
        Remover
      </button>
    </div>
  );
}
```

- [ ] **Step 6: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/product-card.test.tsx
```

Esperado: PASS (3 testes).

- [ ] **Step 7: Escrever testes da página de Sessão (falhando)**

`web/src/app/session/[id]/__tests__/page.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessaoPage from '../page';
import { useSessionStore } from '../../../../store/session-store';
import { Storage } from '../../../../db/types';
import { calcularPrecoUnidadeBase } from '../../../../domain/units';
import { Product, ProductInput, Session } from '../../../../types';

jest.mock('next/navigation', () => ({ useParams: () => ({ id: 's1' }) }));
jest.mock('../../../../db/storage-provider', () => ({ getStorage: jest.fn() }));

import { getStorage } from '../../../../db/storage-provider';

function criarStorageFake(session: Session, produtosIniciais: Product[]): Storage {
  let produtos = produtosIniciais;
  return {
    async createSession() {
      throw new Error('não usado neste teste');
    },
    async listSessions() {
      return [session];
    },
    async getSession(id) {
      return id === session.id ? session : null;
    },
    async addProduct(sessionId, input: ProductInput) {
      const produto: Product = {
        id: `${produtos.length + 1}`,
        sessionId,
        ...input,
        precoUnidadeBase: calcularPrecoUnidadeBase(input.preco, input.quantidade, input.unidade),
      };
      produtos = [...produtos, produto];
      return produto;
    },
    async listProducts() {
      return produtos;
    },
    async deleteProduct(id) {
      produtos = produtos.filter((p) => p.id !== id);
    },
    async deleteSession() {},
  };
}

describe('SessaoPage', () => {
  const session: Session = { id: 's1', categoria: 'Arroz', criadoEm: '2026-09-01T00:00:00.000Z' };

  beforeEach(() => {
    useSessionStore.setState({ storage: null, activeSession: null, products: [] });
  });

  it('lista produtos ordenados e destaca o de melhor preço', async () => {
    const caro: Product = { id: 'a', sessionId: 's1', nome: 'Caro', preco: 20, quantidade: 1, unidade: 'kg', precoUnidadeBase: 20 };
    const barato: Product = { id: 'b', sessionId: 's1', nome: 'Barato', preco: 8, quantidade: 1, unidade: 'kg', precoUnidadeBase: 8 };
    (getStorage as jest.Mock).mockResolvedValue(criarStorageFake(session, [caro, barato]));

    render(<SessaoPage />);

    const nomes = await screen.findAllByText(/Caro|Barato/);
    expect(nomes.map((el) => el.textContent)).toEqual(['Barato', 'Caro']);
    expect(screen.getByText('melhor custo')).toBeInTheDocument();
  });

  it('adiciona produto pelo formulário e some com a lista vazia', async () => {
    (getStorage as jest.Mock).mockResolvedValue(criarStorageFake(session, []));

    render(<SessaoPage />);

    expect(await screen.findByText(/Nenhum produto ainda/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Adicionar produto' }));
    await userEvent.type(screen.getByLabelText('Produto'), 'Arroz 5kg');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '25');
    await userEvent.type(screen.getByLabelText('Quantidade'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('Arroz 5kg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Rodar e confirmar falha**

```bash
npx jest src/app/session
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 9: Implementar a página de Sessão**

`web/src/app/session/[id]/page.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStorage } from '../../../db/storage-provider';
import { useSessionStore } from '../../../store/session-store';
import { ProductCard } from '../../../components/product-card';
import { AddProductForm } from '../../../components/add-product-form';
import { vibrar } from '../../../lib/haptics';

export default function SessaoPage() {
  const { id } = useParams<{ id: string }>();
  const { activeSession, products, setStorage, loadSession, addProduct, removeProduct } = useSessionStore();
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const storage = await getStorage();
      setStorage(storage);
      await loadSession(id);
    }
    iniciar();
  }, [id, setStorage, loadSession]);

  if (!activeSession) return null;

  return (
    <main className="pb-24">
      <h1 className="p-4 text-lg font-semibold">{activeSession.categoria}</h1>

      {products.length === 0 ? (
        <p className="p-6 text-center text-gray-500">Nenhum produto ainda. Toque em &quot;+&quot; pra adicionar.</p>
      ) : (
        products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            melhor={index === 0}
            onDelete={async (produtoId) => {
              await removeProduct(produtoId);
              vibrar();
            }}
          />
        ))
      )}

      <button
        type="button"
        onClick={() => setMostrarForm(true)}
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg"
        aria-label="Adicionar produto"
      >
        +
      </button>

      {mostrarForm && (
        <AddProductForm
          onSubmit={async (input) => {
            await addProduct(input);
            vibrar();
            setMostrarForm(false);
          }}
          onCancel={() => setMostrarForm(false)}
        />
      )}
    </main>
  );
}
```

- [ ] **Step 10: Rodar e confirmar sucesso**

```bash
npx jest src/app/session
```

Esperado: PASS (2 testes).

- [ ] **Step 11: Commit**

```bash
git add src/lib/haptics.ts src/lib/__tests__/haptics.test.ts src/components/product-card.tsx src/components/__tests__/product-card.test.tsx src/app/session
git commit -m "feat(sessao): tela de comparação com swipe pra deletar e vibração"
```

---

### Task 12: Banner de instalação do PWA

**Files:**
- Create: `web/src/components/install-prompt-banner.tsx`
- Test: `web/src/components/__tests__/install-prompt-banner.test.tsx`
- Modify: `web/src/app/layout.tsx`

**Interfaces:**
- Produces: `InstallPromptBanner()` (sem props)

- [ ] **Step 1: Escrever os testes (falhando)**

`web/src/components/__tests__/install-prompt-banner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPromptBanner } from '../install-prompt-banner';

describe('InstallPromptBanner', () => {
  it('mostra botão instalar quando o navegador dispara beforeinstallprompt', async () => {
    render(<InstallPromptBanner />);
    const prompt = jest.fn().mockResolvedValue(undefined);
    const evento = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
    window.dispatchEvent(evento);

    const botao = await screen.findByRole('button', { name: 'Instalar' });
    await userEvent.click(botao);

    expect(prompt).toHaveBeenCalled();
  });

  it('some quando o usuário fecha o aviso', async () => {
    render(<InstallPromptBanner />);
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: jest.fn() }));

    await userEvent.click(await screen.findByRole('button', { name: 'Fechar aviso' }));

    expect(screen.queryByRole('button', { name: 'Instalar' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/install-prompt-banner.test.tsx
```

Esperado: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `InstallPromptBanner`**

`web/src/components/install-prompt-banner.tsx`:

```tsx
'use client';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

function ehIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const standalone = 'standalone' in navigator && (navigator as { standalone?: boolean }).standalone;
  return iOS && !standalone;
}

export function InstallPromptBanner() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [mostrarIOS, setMostrarIOS] = useState(false);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    function aoDisponibilizar(e: Event) {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    }
    window.addEventListener('beforeinstallprompt', aoDisponibilizar);
    setMostrarIOS(ehIOSSafari());
    return () => window.removeEventListener('beforeinstallprompt', aoDisponibilizar);
  }, []);

  if (fechado || (!evento && !mostrarIOS)) return null;

  return (
    <div className="flex items-center justify-between bg-blue-50 p-3 text-sm">
      {evento ? (
        <>
          <span>Instale o ComPreco pra abrir direto da tela inicial.</span>
          <button
            type="button"
            className="font-semibold text-blue-600"
            onClick={async () => {
              await evento.prompt();
              setEvento(null);
            }}
          >
            Instalar
          </button>
        </>
      ) : (
        <span>No iPhone: toque em compartilhar e depois em &quot;Adicionar à Tela de Início&quot;.</span>
      )}
      <button type="button" aria-label="Fechar aviso" onClick={() => setFechado(true)} className="ml-2 text-gray-500">
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/install-prompt-banner.test.tsx
```

Esperado: PASS (2 testes).

- [ ] **Step 5: Ligar o banner no layout raiz**

Em `web/src/app/layout.tsx`, importar e renderizar `<InstallPromptBanner />` logo no início do `<body>`, antes de `{children}`:

```tsx
import type { Metadata } from 'next';
import { BottomNav } from '../components/bottom-nav';
import { InstallPromptBanner } from '../components/install-prompt-banner';
import './globals.css';

export const metadata: Metadata = {
  title: 'ComPreco',
  description: 'Compara preço de produtos por unidade de medida',
  manifest: '/manifest.json',
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="pb-16">
        <InstallPromptBanner />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Verificar build completo**

```bash
npm run build
```

Esperado: build passa sem erro.

- [ ] **Step 7: Commit**

```bash
git add src/components/install-prompt-banner.tsx src/components/__tests__/install-prompt-banner.test.tsx src/app/layout.tsx
git commit -m "feat(pwa): banner de instalação (Android/desktop) e instrução manual pro iPhone"
```

---

### Task 13: Verificação final e deploy na Vercel

**Files:** nenhum arquivo novo — só verificação e deploy.

- [ ] **Step 1: Rodar a suíte completa e o build**

```bash
npm test -- --coverage
npm run build
```

Esperado: todos os testes passam; cobertura ≥ 80% geral e ≥ 95% em `src/domain`; build sem erro, `public/sw.js` e `public/manifest.json` presentes no output.

- [ ] **Step 2: Corrigir eventuais gaps de cobertura**

Se algum arquivo ficar abaixo da meta (Global Constraints), adicionar os casos de teste que faltam antes de seguir — não commitar com cobertura abaixo do alvo.

- [ ] **Step 3: Commit final se houve ajuste**

```bash
git add -A
git commit -m "test: fechar cobertura mínima antes do deploy"
```

- [ ] **Step 4: Conectar o projeto na Vercel**

```bash
npx vercel link
```

Ao ser perguntado pelo diretório do projeto, apontar pra `web/` (Root Directory).

- [ ] **Step 5: Gerar deploy de preview e validar**

```bash
npx vercel
```

Abrir a URL de preview gerada e conferir manualmente:
- `/manifest.json` responde com o JSON do Task 7
- `/sw.js` responde (service worker publicado)
- Histórico, Nova Sessão e tela de Comparação funcionam ponta a ponta

- [ ] **Step 6: Promover pra produção**

Deploy de produção é uma ação pra fora (fica público). Confirmar com o usuário antes de rodar:

```bash
npx vercel --prod
```

- [ ] **Step 7: Commit de qualquer ajuste de configuração feito durante o deploy (se houver)**

```bash
git add -A
git commit -m "chore(deploy): configuração de deploy na Vercel"
```

---

### Task 14: Remover Xcode e ferramentas mobile (só depois do PWA em paridade)

**Pré-condição obrigatória:** só rodar este task depois que o Task 13 estiver completo e o PWA cobrir Histórico, Nova Sessão e Comparação com os mesmos dados que o app Expo atual — a partir daqui o app Expo deixa de ser a rede de segurança. Não pular a ordem.

**Files:**
- Delete: `ComPreco/ios/`
- Delete: `ComPreco/.expo/`
- Delete: `ComPreco/node_modules/`

Sem testes — é limpeza de ambiente, não código.

- [ ] **Step 1: Checklist de paridade do PWA (confirmar antes de apagar qualquer coisa)**

Confirmar manualmente na URL de produção da Vercel:
- Criar sessão nova, adicionar 2+ produtos, ver ranking por melhor preço
- Fechar aba e reabrir — histórico persiste (IndexedDB)
- Deletar produto e deletar sessão funcionam
- App abre instalado (Adicionar à Tela de Início) e funciona sem internet

Se algum item falhar, parar aqui e voltar pro task correspondente — não seguir pra remoção.

- [ ] **Step 2: Remover artefatos específicos do projeto ComPreco (não afeta outros projetos)**

```bash
cd /Users/bmondin/Dev/ComPreco/ComPreco
rm -rf ios .expo node_modules
```

- [ ] **Step 3: Commit da remoção dos artefatos do projeto**

```bash
cd /Users/bmondin/Dev/ComPreco
git add -A
git commit -m "chore(mobile): remover projeto ios/, node_modules e cache Expo após migração pra PWA"
```

- [ ] **Step 4: Checar o que pesa no sistema antes de remover — Xcode.app e simuladores são compartilhados com qualquer outro projeto iOS no Mac, não só o ComPreco**

```bash
du -sh /Applications/Xcode.app 2>/dev/null
du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator 2>/dev/null
du -sh ~/Library/Caches/CocoaPods 2>/dev/null
```

- [ ] **Step 5: Confirmar com o usuário antes de tocar nas ferramentas do sistema**

Antes de rodar os comandos do Step 6, perguntar explicitamente: "confirma remover Xcode.app e simuladores do Mac? Isso é do sistema, não só deste projeto — se precisar de novo, é vários GB de download e horas de espera." Só seguir com um "sim" explícito.

- [ ] **Step 6: Remover Xcode e dependências de sistema (só após confirmação do Step 5)**

```bash
sudo rm -rf /Applications/Xcode.app
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ~/Library/Developer/CoreSimulator
rm -rf ~/Library/Caches/CocoaPods

# Só rodar os que se aplicarem — checar antes com `brew list` / `gem list cocoapods`:
brew uninstall cocoapods watchman 2>/dev/null
sudo gem uninstall cocoapods 2>/dev/null
```

Nota: Xcode Command Line Tools (`xcode-select`) fica de fora dessa limpeza — git, Homebrew e outras ferramentas do sistema dependem dele; removê-lo quebra coisa fora do escopo deste projeto.

- [ ] **Step 7: Confirmar espaço liberado**

```bash
df -h /
```
