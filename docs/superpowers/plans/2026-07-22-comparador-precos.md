# ComPreco Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App iOS pessoal (Expo/React Native + TypeScript) que compara produtos de supermercado normalizando preço por kg, L ou unidade, com histórico local em SQLite.

**Architecture:** Camada de domínio pura (conversão de unidade, ranking, validação) isolada de I/O. Camada de storage por trás de uma interface `Storage` com duas implementações — `InMemoryStorage` (usada nos testes, sem mocks) e `SqliteStorage` (produção, via `expo-sqlite`). Estado da sessão ativa em Zustand. Telas via `expo-router` (tabs: Histórico / Nova Comparação + rota `session/[id]`).

**Tech Stack:** Expo (SDK atual) + TypeScript, `expo-router`, `expo-sqlite`, `zustand`, `react-native-gesture-handler` (swipe-to-delete, já vem no template), Jest (`jest-expo`) + `@testing-library/react-native`.

## Global Constraints

- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, target ES2022, `moduleResolution: bundler`
- Proibido `any` explícito/implícito; proibido `as Type` exceto parsing externo justificado com comentário (ex: mapear linha de SQLite)
- Arquivos: kebab-case (`product-card.tsx`); Componentes React: PascalCase (`ProductCard`); Hooks/stores: camelCase com prefixo `use` (`useSessionStore`); Constantes: UPPER_SNAKE_CASE
- TDD obrigatório: Red → Green → Refactor, testes antes do código de produção
- Nome de teste: `deve <comportamento> quando <condição>`
- Cobertura alvo: 80% geral, 95% em lógica crítica (normalização/ranking)
- Mocks proibidos para lógica de negócio interna — usar `InMemoryStorage` real nos testes de store, nunca mock de storage
- Commit: `tipo(escopo): descrição em português` (feat/fix/refactor/docs/test/chore)
- JSDoc obrigatório em funções públicas exportadas da camada de domínio e na interface `Storage`

---

## File Structure

```
ComPreco/
  app/
    _layout.tsx                 # Stack root + GestureHandlerRootView + init storage
    (tabs)/
      _layout.tsx                # Tabs: Histórico / Nova Comparação
      index.tsx                  # Tela Histórico
      nova.tsx                   # Tela Nova Sessão
    session/
      [id].tsx                   # Tela Lista de Comparação (sessão ativa)
  src/
    types/
      index.ts                   # Unit, Session, Product, ProductInput
    domain/
      units.ts                   # conversão de unidade + cálculo preço base
      ranking.ts                 # ordenação por melhor preço
      validation.ts               # validação de produto/categoria
      __tests__/
        units.test.ts
        ranking.test.ts
        validation.test.ts
    db/
      types.ts                    # interface Storage
      in-memory-storage.ts        # implementação em memória (testes)
      sqlite-storage.ts           # implementação expo-sqlite (produção)
      __tests__/
        in-memory-storage.test.ts
    store/
      session-store.ts            # useSessionStore (zustand)
      __tests__/
        session-store.test.ts
    components/
      unit-picker.tsx
      add-product-form.tsx
      product-card.tsx
      session-list-item.tsx
      __tests__/
        unit-picker.test.tsx
        add-product-form.test.tsx
        product-card.test.tsx
        session-list-item.test.tsx
  jest.config.js
  tsconfig.json
```

---

### Task 1: Scaffold do projeto Expo + ferramentas de teste

**Files:**
- Create: projeto inteiro via `create-expo-app` em `/Users/bmondin/Dev/ComPreco/ComPreco` (raiz do app RN)
- Modify: `package.json`, `tsconfig.json`, `jest.config.js`

**Interfaces:**
- Produces: projeto Expo rodável (`npx expo start`), `npx tsc --noEmit` limpo, `npx jest` funcional

- [ ] **Step 1: Criar o projeto Expo com TypeScript**

```bash
cd /Users/bmondin/Dev/ComPreco
npx create-expo-app@latest ComPreco --template blank-typescript
cd ComPreco
```

- [ ] **Step 2: Instalar expo-router e dependências de navegação**

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-gesture-handler react-native-reanimated
```

- [ ] **Step 3: Instalar expo-sqlite e zustand**

```bash
npx expo install expo-sqlite
npm install zustand
```

- [ ] **Step 4: Instalar ferramentas de teste**

Verifique a versão exata de `react` em `package.json` (campo `dependencies.react`) e use o mesmo valor no lugar de `<REACT_VERSION>` abaixo (sem `^`).

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @types/jest react-test-renderer@<REACT_VERSION>
```

- [ ] **Step 5: Configurar `package.json`**

Editar `package.json`:

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 6: Criar `jest.config.js`**

```javascript
module.exports = {
  preset: 'jest-expo',
};
```

- [ ] **Step 7: Ajustar `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "target": "ES2022",
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 8: Criar pastas da camada de domínio/storage/store/components**

```bash
mkdir -p src/types src/domain/__tests__ src/db/__tests__ src/store/__tests__ src/components/__tests__ app/\(tabs\) app/session
```

- [ ] **Step 9: Verificar que o projeto compila e o test runner sobe**

```bash
npx tsc --noEmit
npx jest --passWithNoTests
```

Expected: `tsc` sem erros; jest imprime `No tests found, exiting with code 0`.

- [ ] **Step 10: Commit**

```bash
git add ComPreco
git commit -m "chore: scaffold do projeto Expo com TypeScript, expo-router e jest"
```

---

### Task 2: Domínio — conversão de unidade e cálculo de preço base

**Files:**
- Create: `ComPreco/src/types/index.ts`
- Create: `ComPreco/src/domain/units.ts`
- Test: `ComPreco/src/domain/__tests__/units.test.ts`

**Interfaces:**
- Produces: `type Unit = 'g' | 'kg' | 'ml' | 'L' | 'un'`, `interface Session`, `interface Product`, `interface ProductInput`, `unidadeBase(unidade: Unit): 'kg' | 'L' | 'un'`, `normalizarQuantidade(quantidade: number, unidade: Unit): number`, `calcularPrecoUnidadeBase(preco: number, quantidade: number, unidade: Unit): number`

- [ ] **Step 1: Criar tipos compartilhados**

`ComPreco/src/types/index.ts`:

```typescript
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

- [ ] **Step 2: Escrever os testes de conversão (devem falhar)**

`ComPreco/src/domain/__tests__/units.test.ts`:

```typescript
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
});
```

- [ ] **Step 3: Rodar e confirmar falha**

```bash
npx jest src/domain/__tests__/units.test.ts
```

Expected: FAIL — `Cannot find module '../units'`

- [ ] **Step 4: Implementar `units.ts`**

`ComPreco/src/domain/units.ts`:

```typescript
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
```

- [ ] **Step 5: Rodar e confirmar sucesso**

```bash
npx jest src/domain/__tests__/units.test.ts
```

Expected: PASS — 13 testes

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/domain/units.ts src/domain/__tests__/units.test.ts
git commit -m "feat(domain): adicionar conversão de unidade e cálculo de preço base"
```

---

### Task 3: Domínio — ranking por melhor preço

**Files:**
- Create: `ComPreco/src/domain/ranking.ts`
- Test: `ComPreco/src/domain/__tests__/ranking.test.ts`

**Interfaces:**
- Consumes: `Product` de `../types`
- Produces: `ordenarPorMelhorPreco(produtos: Product[]): Product[]`

- [ ] **Step 1: Escrever teste (deve falhar)**

`ComPreco/src/domain/__tests__/ranking.test.ts`:

```typescript
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

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/domain/__tests__/ranking.test.ts
```

Expected: FAIL — `Cannot find module '../ranking'`

- [ ] **Step 3: Implementar `ranking.ts`**

`ComPreco/src/domain/ranking.ts`:

```typescript
import { Product } from '../types';

/** Ordena produtos do melhor custo-benefício (menor preço/unidade base) pro pior. */
export function ordenarPorMelhorPreco(produtos: Product[]): Product[] {
  return [...produtos].sort((a, b) => a.precoUnidadeBase - b.precoUnidadeBase);
}
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/domain/__tests__/ranking.test.ts
```

Expected: PASS — 3 testes

- [ ] **Step 5: Commit**

```bash
git add src/domain/ranking.ts src/domain/__tests__/ranking.test.ts
git commit -m "feat(domain): adicionar ordenação por melhor preço"
```

---

### Task 4: Domínio — validação de produto e categoria

**Files:**
- Create: `ComPreco/src/domain/validation.ts`
- Test: `ComPreco/src/domain/__tests__/validation.test.ts`

**Interfaces:**
- Produces: `interface ValidationError { campo: string; mensagem: string }`, `validarProduto(input: { nome: string; preco: number; quantidade: number }): ValidationError[]`, `validarCategoria(categoria: string): ValidationError[]`

- [ ] **Step 1: Escrever testes (devem falhar)**

`ComPreco/src/domain/__tests__/validation.test.ts`:

```typescript
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

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/domain/__tests__/validation.test.ts
```

Expected: FAIL — `Cannot find module '../validation'`

- [ ] **Step 3: Implementar `validation.ts`**

`ComPreco/src/domain/validation.ts`:

```typescript
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

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/domain/__tests__/validation.test.ts
```

Expected: PASS — 9 testes

- [ ] **Step 5: Commit**

```bash
git add src/domain/validation.ts src/domain/__tests__/validation.test.ts
git commit -m "feat(domain): adicionar validação de produto e categoria"
```

---

### Task 5: Storage — interface + implementação em memória

**Files:**
- Create: `ComPreco/src/db/types.ts`
- Create: `ComPreco/src/db/in-memory-storage.ts`
- Test: `ComPreco/src/db/__tests__/in-memory-storage.test.ts`

**Interfaces:**
- Consumes: `Session`, `Product`, `ProductInput` de `../types`; `calcularPrecoUnidadeBase` de `../domain/units`
- Produces: `interface Storage`, `class InMemoryStorage implements Storage`

- [ ] **Step 1: Definir a interface `Storage`**

`ComPreco/src/db/types.ts`:

```typescript
import { Product, ProductInput, Session } from '../types';

/** Contrato de persistência — implementado por InMemoryStorage (testes) e SqliteStorage (produção). */
export interface Storage {
  createSession(categoria: string): Promise<Session>;
  listSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  addProduct(sessionId: string, input: ProductInput): Promise<Product>;
  listProducts(sessionId: string): Promise<Product[]>;
  deleteProduct(id: string): Promise<void>;
}
```

- [ ] **Step 2: Escrever os testes da implementação em memória (devem falhar)**

`ComPreco/src/db/__tests__/in-memory-storage.test.ts`:

```typescript
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
});
```

- [ ] **Step 3: Rodar e confirmar falha**

```bash
npx jest src/db/__tests__/in-memory-storage.test.ts
```

Expected: FAIL — `Cannot find module '../in-memory-storage'`

- [ ] **Step 4: Implementar `in-memory-storage.ts`**

`ComPreco/src/db/in-memory-storage.ts`:

```typescript
import { Product, ProductInput, Session } from '../types';
import { calcularPrecoUnidadeBase } from '../domain/units';
import { Storage } from './types';

function gerarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

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
}
```

Nota: `criadoEm` é `Date.now()`-based via `gerarId`, mas o campo em si vem de `new Date().toISOString()` — em testes que criam duas sessões em sequência síncrona isso pode colidir no mesmo milissegundo. Se o teste de ordenação falhar por empate, adicione `await new Promise((r) => setTimeout(r, 2))` entre as duas chamadas de `createSession` no teste.

- [ ] **Step 5: Rodar e confirmar sucesso**

```bash
npx jest src/db/__tests__/in-memory-storage.test.ts
```

Expected: PASS — 6 testes (se o teste de ordenação falhar por timestamps iguais, aplique o ajuste acima e rode de novo)

- [ ] **Step 6: Commit**

```bash
git add src/db/types.ts src/db/in-memory-storage.ts src/db/__tests__/in-memory-storage.test.ts
git commit -m "feat(db): adicionar interface Storage e implementação em memória"
```

---

### Task 6: Storage — implementação SQLite (produção)

**Files:**
- Create: `ComPreco/src/db/sqlite-storage.ts`

**Interfaces:**
- Consumes: `Storage` de `./types`; `calcularPrecoUnidadeBase` de `../domain/units`
- Produces: `class SqliteStorage implements Storage`, `SqliteStorage.open(): Promise<SqliteStorage>`

Sem teste automatizado nesta task: `expo-sqlite` é um módulo nativo que não roda sob Jest puro. A implementação segue exatamente o mesmo contrato `Storage` já validado por `InMemoryStorage`, e é verificada manualmente na Task 16 (build no device). Isso é intencional — evita depender de infraestrutura nativa de teste desproporcional pro escopo de um app pessoal.

- [ ] **Step 1: Implementar `sqlite-storage.ts`**

`ComPreco/src/db/sqlite-storage.ts`:

```typescript
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
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add src/db/sqlite-storage.ts
git commit -m "feat(db): adicionar implementação SqliteStorage pra produção"
```

---

### Task 7: Store — estado da sessão ativa (Zustand)

**Files:**
- Create: `ComPreco/src/store/session-store.ts`
- Test: `ComPreco/src/store/__tests__/session-store.test.ts`

**Interfaces:**
- Consumes: `Storage` de `../db/types`; `InMemoryStorage` de `../db/in-memory-storage` (só no teste); `ordenarPorMelhorPreco` de `../domain/ranking`
- Produces: `useSessionStore` com estado `{ storage, activeSession, products }` e ações `setStorage`, `loadSession`, `addProduct`, `removeProduct`

- [ ] **Step 1: Escrever os testes (devem falhar)**

`ComPreco/src/store/__tests__/session-store.test.ts`:

```typescript
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

Expected: FAIL — `Cannot find module '../session-store'`

- [ ] **Step 3: Implementar `session-store.ts`**

`ComPreco/src/store/session-store.ts`:

```typescript
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

Expected: PASS — 3 testes

- [ ] **Step 5: Commit**

```bash
git add src/store/session-store.ts src/store/__tests__/session-store.test.ts
git commit -m "feat(store): adicionar useSessionStore com carregamento e ranking automático"
```

---

### Task 8: Componente UnitPicker

**Files:**
- Create: `ComPreco/src/components/unit-picker.tsx`
- Test: `ComPreco/src/components/__tests__/unit-picker.test.tsx`

**Interfaces:**
- Consumes: `Unit` de `../types`
- Produces: `UnitPicker({ value, onChange }: { value: Unit; onChange: (u: Unit) => void })`

- [ ] **Step 1: Escrever teste (deve falhar)**

`ComPreco/src/components/__tests__/unit-picker.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UnitPicker } from '../unit-picker';

describe('UnitPicker', () => {
  it('deve chamar onChange com a unidade correta ao tocar um chip', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<UnitPicker value="un" onChange={onChange} />);

    fireEvent.press(getByTestId('unit-chip-kg'));

    expect(onChange).toHaveBeenCalledWith('kg');
  });

  it('deve renderizar todos os chips de unidade', () => {
    const { getByTestId } = render(<UnitPicker value="un" onChange={jest.fn()} />);

    expect(getByTestId('unit-chip-g')).toBeTruthy();
    expect(getByTestId('unit-chip-kg')).toBeTruthy();
    expect(getByTestId('unit-chip-ml')).toBeTruthy();
    expect(getByTestId('unit-chip-L')).toBeTruthy();
    expect(getByTestId('unit-chip-un')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/unit-picker.test.tsx
```

Expected: FAIL — `Cannot find module '../unit-picker'`

- [ ] **Step 3: Implementar `unit-picker.tsx`**

`ComPreco/src/components/unit-picker.tsx`:

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Unit } from '../types';

const UNIDADES: Unit[] = ['g', 'kg', 'ml', 'L', 'un'];

interface Props {
  value: Unit;
  onChange: (unidade: Unit) => void;
}

export function UnitPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row} testID="unit-picker">
      {UNIDADES.map((u) => (
        <Pressable
          key={u}
          testID={`unit-chip-${u}`}
          onPress={() => onChange(u)}
          style={[styles.chip, value === u && styles.chipSelected]}
        >
          <Text style={value === u ? styles.textSelected : styles.text}>{u}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  text: { color: '#333' },
  textSelected: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/unit-picker.test.tsx
```

Expected: PASS — 2 testes

- [ ] **Step 5: Commit**

```bash
git add src/components/unit-picker.tsx src/components/__tests__/unit-picker.test.tsx
git commit -m "feat(ui): adicionar componente UnitPicker"
```

---

### Task 9: Componente AddProductForm

**Files:**
- Create: `ComPreco/src/components/add-product-form.tsx`
- Test: `ComPreco/src/components/__tests__/add-product-form.test.tsx`

**Interfaces:**
- Consumes: `validarProduto` de `../domain/validation`; `UnitPicker` de `./unit-picker`; `Unit` de `../types`
- Produces: `AddProductForm({ onSubmit }: { onSubmit: (input: ProductInput) => void })`

- [ ] **Step 1: Escrever testes (devem falhar)**

`ComPreco/src/components/__tests__/add-product-form.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddProductForm } from '../add-product-form';

describe('AddProductForm', () => {
  it('deve mostrar erro inline quando salva produto com preço zero', () => {
    const { getByTestId, getByText } = render(<AddProductForm onSubmit={jest.fn()} />);

    fireEvent.changeText(getByTestId('input-nome'), 'Arroz');
    fireEvent.changeText(getByTestId('input-preco'), '0');
    fireEvent.changeText(getByTestId('input-quantidade'), '5');
    fireEvent.press(getByTestId('botao-salvar'));

    expect(getByText('preço deve ser maior que zero')).toBeTruthy();
  });

  it('deve chamar onSubmit com dados corretos quando formulário é válido', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<AddProductForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('input-nome'), 'Arroz 5kg');
    fireEvent.changeText(getByTestId('input-preco'), '25');
    fireEvent.changeText(getByTestId('input-quantidade'), '5');
    fireEvent.press(getByTestId('unit-chip-kg'));
    fireEvent.press(getByTestId('botao-salvar'));

    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Arroz 5kg', preco: 25, quantidade: 5, unidade: 'kg' });
  });

  it('deve não chamar onSubmit quando nome está vazio', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<AddProductForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('input-preco'), '10');
    fireEvent.changeText(getByTestId('input-quantidade'), '1');
    fireEvent.press(getByTestId('botao-salvar'));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/add-product-form.test.tsx
```

Expected: FAIL — `Cannot find module '../add-product-form'`

- [ ] **Step 3: Implementar `add-product-form.tsx`**

`ComPreco/src/components/add-product-form.tsx`:

```typescript
import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { ProductInput, Unit } from '../types';
import { validarProduto } from '../domain/validation';
import { UnitPicker } from './unit-picker';

interface Props {
  onSubmit: (input: ProductInput) => void;
}

export function AddProductForm({ onSubmit }: Props) {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState<Unit>('un');
  const [erros, setErros] = useState<string[]>([]);

  function handleSubmit() {
    const precoNum = Number(preco.replace(',', '.'));
    const quantidadeNum = Number(quantidade.replace(',', '.'));
    const validationErrors = validarProduto({ nome, preco: precoNum, quantidade: quantidadeNum });

    if (validationErrors.length > 0) {
      setErros(validationErrors.map((e) => e.mensagem));
      return;
    }

    setErros([]);
    onSubmit({ nome, preco: precoNum, quantidade: quantidadeNum, unidade });
    setNome('');
    setPreco('');
    setQuantidade('');
  }

  return (
    <View style={styles.form}>
      <TextInput testID="input-nome" placeholder="Nome do produto" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput
        testID="input-preco"
        placeholder="Preço R$"
        value={preco}
        onChangeText={setPreco}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        testID="input-quantidade"
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <UnitPicker value={unidade} onChange={setUnidade} />
      {erros.map((erro) => (
        <Text key={erro} style={styles.erro}>
          {erro}
        </Text>
      ))}
      <Pressable testID="botao-salvar" onPress={handleSubmit} style={styles.botao}>
        <Text style={styles.botaoTexto}>Salvar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  erro: { color: '#c62828', fontSize: 13 },
  botao: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/add-product-form.test.tsx
```

Expected: PASS — 3 testes

- [ ] **Step 5: Commit**

```bash
git add src/components/add-product-form.tsx src/components/__tests__/add-product-form.test.tsx
git commit -m "feat(ui): adicionar componente AddProductForm com validação inline"
```

---

### Task 10: Componente ProductCard

**Files:**
- Create: `ComPreco/src/components/product-card.tsx`
- Test: `ComPreco/src/components/__tests__/product-card.test.tsx`

**Interfaces:**
- Consumes: `Product` de `../types`; `unidadeBase` de `../domain/units`
- Produces: `ProductCard({ product, melhorPreco }: { product: Product; melhorPreco: boolean })`

- [ ] **Step 1: Escrever testes (devem falhar)**

`ComPreco/src/components/__tests__/product-card.test.tsx`:

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductCard } from '../product-card';
import { Product } from '../../types';

const produto: Product = {
  id: '1',
  sessionId: 's1',
  nome: 'Arroz 5kg',
  preco: 25,
  quantidade: 5,
  unidade: 'kg',
  precoUnidadeBase: 5,
};

describe('ProductCard', () => {
  it('deve mostrar badge de melhor custo quando melhorPreco é true', () => {
    const { getByTestId } = render(<ProductCard product={produto} melhorPreco />);
    expect(getByTestId('badge-melhor')).toBeTruthy();
  });

  it('deve não mostrar badge quando melhorPreco é false', () => {
    const { queryByTestId } = render(<ProductCard product={produto} melhorPreco={false} />);
    expect(queryByTestId('badge-melhor')).toBeNull();
  });

  it('deve mostrar preço por unidade base formatado', () => {
    const { getByText } = render(<ProductCard product={produto} melhorPreco={false} />);
    expect(getByText('R$ 5.00/kg')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/product-card.test.tsx
```

Expected: FAIL — `Cannot find module '../product-card'`

- [ ] **Step 3: Implementar `product-card.tsx`**

`ComPreco/src/components/product-card.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Product } from '../types';
import { unidadeBase } from '../domain/units';

interface Props {
  product: Product;
  melhorPreco: boolean;
}

export function ProductCard({ product, melhorPreco }: Props) {
  const base = unidadeBase(product.unidade);

  return (
    <View testID="product-card" style={[styles.card, melhorPreco && styles.cardMelhor]}>
      <Text style={styles.nome}>{product.nome}</Text>
      <Text style={styles.detalhe}>
        {product.quantidade}
        {product.unidade} · R$ {product.preco.toFixed(2)}
      </Text>
      <Text style={styles.destaque}>
        R$ {product.precoUnidadeBase.toFixed(2)}/{base}
      </Text>
      {melhorPreco && (
        <Text testID="badge-melhor" style={styles.badge}>
          melhor custo
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 8 },
  cardMelhor: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  nome: { fontSize: 16, fontWeight: '600' },
  detalhe: { color: '#666', marginTop: 2 },
  destaque: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  badge: { color: '#2e7d32', fontWeight: '600', marginTop: 4 },
});
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/product-card.test.tsx
```

Expected: PASS — 3 testes

- [ ] **Step 5: Commit**

```bash
git add src/components/product-card.tsx src/components/__tests__/product-card.test.tsx
git commit -m "feat(ui): adicionar componente ProductCard com destaque de melhor preço"
```

---

### Task 11: Componente SessionListItem

**Files:**
- Create: `ComPreco/src/components/session-list-item.tsx`
- Test: `ComPreco/src/components/__tests__/session-list-item.test.tsx`

**Interfaces:**
- Consumes: `Session` de `../types`
- Produces: `SessionListItem({ session, totalProdutos, melhorPreco, onPress }: Props)`

- [ ] **Step 1: Escrever testes (devem falhar)**

`ComPreco/src/components/__tests__/session-list-item.test.tsx`:

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SessionListItem } from '../session-list-item';
import { Session } from '../../types';

const sessao: Session = { id: '1', categoria: 'Arroz', criadoEm: '2026-07-22T10:00:00.000Z' };

describe('SessionListItem', () => {
  it('deve chamar onPress ao tocar o item', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SessionListItem session={sessao} totalProdutos={3} melhorPreco={5.2} onPress={onPress} />
    );

    fireEvent.press(getByTestId('session-item'));

    expect(onPress).toHaveBeenCalled();
  });

  it('deve mostrar contagem de produtos no plural', () => {
    const { getByText } = render(
      <SessionListItem session={sessao} totalProdutos={3} melhorPreco={5.2} onPress={jest.fn()} />
    );
    expect(getByText('3 produtos · melhor R$ 5.20')).toBeTruthy();
  });

  it('deve mostrar contagem de produtos no singular', () => {
    const { getByText } = render(
      <SessionListItem session={sessao} totalProdutos={1} melhorPreco={5.2} onPress={jest.fn()} />
    );
    expect(getByText('1 produto · melhor R$ 5.20')).toBeTruthy();
  });

  it('deve omitir melhor preço quando null', () => {
    const { getByText } = render(
      <SessionListItem session={sessao} totalProdutos={0} melhorPreco={null} onPress={jest.fn()} />
    );
    expect(getByText('0 produtos')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e confirmar falha**

```bash
npx jest src/components/__tests__/session-list-item.test.tsx
```

Expected: FAIL — `Cannot find module '../session-list-item'`

- [ ] **Step 3: Implementar `session-list-item.tsx`**

`ComPreco/src/components/session-list-item.tsx`:

```typescript
import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Session } from '../types';

interface Props {
  session: Session;
  totalProdutos: number;
  melhorPreco: number | null;
  onPress: () => void;
}

export function SessionListItem({ session, totalProdutos, melhorPreco, onPress }: Props) {
  const contagem = `${totalProdutos} produto${totalProdutos !== 1 ? 's' : ''}`;
  const sufixo = melhorPreco !== null ? ` · melhor R$ ${melhorPreco.toFixed(2)}` : '';

  return (
    <Pressable testID="session-item" onPress={onPress} style={styles.item}>
      <Text style={styles.categoria}>{session.categoria}</Text>
      <Text style={styles.meta}>
        {contagem}
        {sufixo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoria: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', marginTop: 2 },
});
```

- [ ] **Step 4: Rodar e confirmar sucesso**

```bash
npx jest src/components/__tests__/session-list-item.test.tsx
```

Expected: PASS — 4 testes

- [ ] **Step 5: Commit**

```bash
git add src/components/session-list-item.tsx src/components/__tests__/session-list-item.test.tsx
git commit -m "feat(ui): adicionar componente SessionListItem"
```

---

### Task 12: Layouts de navegação (root + tabs)

**Files:**
- Create: `ComPreco/app/_layout.tsx`
- Create: `ComPreco/app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `useSessionStore` de `../src/store/session-store`; `SqliteStorage` de `../src/db/sqlite-storage`

Sem teste automatizado — layout de navegação puro, verificado manualmente na Task 16. `expo-router` exige que essas rotas sigam a convenção de nome de arquivo (`_layout.tsx`), então não seguem o padrão kebab-case genérico.

- [ ] **Step 1: Implementar `app/_layout.tsx`**

`ComPreco/app/_layout.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SqliteStorage } from '../src/db/sqlite-storage';
import { useSessionStore } from '../src/store/session-store';

export default function RootLayout() {
  const [pronto, setPronto] = useState(false);
  const setStorage = useSessionStore((s) => s.setStorage);

  useEffect(() => {
    SqliteStorage.open().then((storage) => {
      setStorage(storage);
      setPronto(true);
    });
  }, [setStorage]);

  if (!pronto) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Comparação' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
```

- [ ] **Step 2: Implementar `app/(tabs)/_layout.tsx`**

`ComPreco/app/(tabs)/_layout.tsx`:

```typescript
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Histórico' }} />
      <Tabs.Screen name="nova" options={{ title: 'Nova Comparação' }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros (as telas `(tabs)/index.tsx`, `(tabs)/nova.tsx` e `session/[id].tsx` ainda não existem — isso é esperado e resolvido nas próximas tasks; se o typecheck reclamar de rota ausente, prossiga, expo-router resolve isso em runtime, não em tipo)

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx "app/(tabs)/_layout.tsx"
git commit -m "feat(nav): adicionar layout raiz e layout de tabs"
```

---

### Task 13: Tela Nova Sessão

**Files:**
- Create: `ComPreco/app/(tabs)/nova.tsx`

**Interfaces:**
- Consumes: `useSessionStore` de `../../src/store/session-store`; `validarCategoria` de `../../src/domain/validation`

Sem teste automatizado dedicado — a lógica de validação já está coberta na Task 4 (`validarCategoria`) e o comportamento de navegação é verificado manualmente na Task 16.

- [ ] **Step 1: Implementar `app/(tabs)/nova.tsx`**

`ComPreco/app/(tabs)/nova.tsx`:

```typescript
import { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../src/store/session-store';
import { validarCategoria } from '../../src/domain/validation';

export default function NovaSessaoScreen() {
  const router = useRouter();
  const storage = useSessionStore((s) => s.storage);
  const [categoria, setCategoria] = useState('');
  const [erro, setErro] = useState('');

  async function criar() {
    const erros = validarCategoria(categoria);
    if (erros.length > 0) {
      setErro(erros[0]?.mensagem ?? '');
      return;
    }
    if (!storage) return;
    const session = await storage.createSession(categoria);
    setCategoria('');
    setErro('');
    router.push(`/session/${session.id}`);
  }

  return (
    <View style={styles.container}>
      <TextInput
        testID="input-categoria"
        placeholder="Categoria (ex: arroz)"
        value={categoria}
        onChangeText={setCategoria}
        style={styles.input}
      />
      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
      <Pressable testID="botao-criar-sessao" onPress={criar} style={styles.botao}>
        <Text style={styles.botaoTexto}>Criar comparação</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  erro: { color: '#c62828' },
  botao: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/nova.tsx"
git commit -m "feat(ui): adicionar tela Nova Sessão"
```

---

### Task 14: Tela Histórico

**Files:**
- Create: `ComPreco/app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `useSessionStore` de `../../src/store/session-store`; `SessionListItem` de `../../src/components/session-list-item`

Sem teste automatizado dedicado — a formatação de contagem/melhor preço já está coberta na Task 11 (`SessionListItem`). Comportamento de navegação verificado manualmente na Task 16.

- [ ] **Step 1: Implementar `app/(tabs)/index.tsx`**

`ComPreco/app/(tabs)/index.tsx`:

```typescript
import { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSessionStore } from '../../src/store/session-store';
import { SessionListItem } from '../../src/components/session-list-item';
import { Session } from '../../src/types';

interface Resumo {
  total: number;
  melhor: number | null;
}

export default function HistoricoScreen() {
  const router = useRouter();
  const storage = useSessionStore((s) => s.storage);
  const [sessoes, setSessoes] = useState<Session[]>([]);
  const [resumos, setResumos] = useState<Record<string, Resumo>>({});

  useFocusEffect(
    useCallback(() => {
      if (!storage) return;
      storage.listSessions().then(async (lista) => {
        setSessoes(lista);
        const entradas = await Promise.all(
          lista.map(async (s): Promise<[string, Resumo]> => {
            const produtos = await storage.listProducts(s.id);
            const melhor = produtos.length > 0 ? Math.min(...produtos.map((p) => p.precoUnidadeBase)) : null;
            return [s.id, { total: produtos.length, melhor }];
          })
        );
        setResumos(Object.fromEntries(entradas));
      });
    }, [storage])
  );

  if (sessoes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Nenhuma comparação ainda. Toque em &quot;Nova Comparação&quot;.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SessionListItem
            session={item}
            totalProdutos={resumos[item.id]?.total ?? 0}
            melhorPreco={resumos[item.id]?.melhor ?? null}
            onPress={() => router.push(`/session/${item.id}`)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
});
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat(ui): adicionar tela Histórico"
```

---

### Task 15: Tela Lista de Comparação (sessão ativa)

**Files:**
- Create: `ComPreco/app/session/[id].tsx`

**Interfaces:**
- Consumes: `useSessionStore` de `../../src/store/session-store`; `ProductCard` de `../../src/components/product-card`; `AddProductForm` de `../../src/components/add-product-form`

Sem teste automatizado dedicado — comportamento de ranking já coberto na Task 7 (`session-store`), badge de melhor preço na Task 10, validação de form na Task 9. Fluxo completo de tela verificado manualmente na Task 16.

- [ ] **Step 1: Implementar `app/session/[id].tsx`**

`ComPreco/app/session/[id].tsx`:

```typescript
import { useEffect, useState } from 'react';
import { View, FlatList, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useSessionStore } from '../../src/store/session-store';
import { ProductCard } from '../../src/components/product-card';
import { AddProductForm } from '../../src/components/add-product-form';

export default function SessaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loadSession = useSessionStore((s) => s.loadSession);
  const addProduct = useSessionStore((s) => s.addProduct);
  const removeProduct = useSessionStore((s) => s.removeProduct);
  const products = useSessionStore((s) => s.products);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (id) loadSession(id);
  }, [id, loadSession]);

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <Text style={styles.empty}>Adicione um produto pra comparar.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => (
            <Swipeable
              renderRightActions={() => (
                <Pressable onPress={() => removeProduct(item.id)} style={styles.deleteAction}>
                  <Text style={styles.deleteText}>Excluir</Text>
                </Pressable>
              )}
            >
              <ProductCard product={item} melhorPreco={index === 0} />
            </Swipeable>
          )}
        />
      )}
      <Pressable testID="botao-add-produto" onPress={() => setModalAberto(true)} style={styles.fab}>
        <Text style={styles.fabTexto}>+ Adicionar produto</Text>
      </Pressable>
      <Modal visible={modalAberto} animationType="slide">
        <AddProductForm
          onSubmit={async (input) => {
            await addProduct(input);
            setModalAberto(false);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
  fab: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  fabTexto: { color: '#fff', fontWeight: '600' },
  deleteAction: { backgroundColor: '#c62828', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10, marginBottom: 8 },
  deleteText: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sem erros

- [ ] **Step 3: Commit**

```bash
git add app/session/\[id\].tsx
git commit -m "feat(ui): adicionar tela de comparação com swipe pra deletar"
```

---

### Task 16: Verificação manual no device + build via Xcode

**Files:** nenhum arquivo novo — task de verificação

- [ ] **Step 1: Rodar suíte completa e checar cobertura**

```bash
npx jest --coverage
```

Expected: todos os testes PASS; cobertura de `src/domain` próxima de 95%, geral acima de 80%

- [ ] **Step 2: Gerar o projeto nativo iOS**

```bash
npx expo prebuild --platform ios
```

Expected: pasta `ios/` criada com projeto Xcode

- [ ] **Step 3: Conectar iPhone via USB e rodar no device**

```bash
npx expo run:ios --device
```

Expected: Xcode abre, pede seleção do seu Apple ID (conta grátis) como signing team na aba "Signing & Capabilities" do target — selecione seu Apple ID pessoal, deixe o Xcode resolver o provisioning automaticamente, o app instala e abre no iPhone

- [ ] **Step 4: Checklist de fluxo completo no device**

Validar manualmente, na ordem:
- Aba "Nova Comparação": criar sessão "arroz" → deve navegar pra tela da sessão
- Adicionar produto "Arroz 5kg", preço 25, quantidade 5, unidade kg → deve aparecer na lista com R$ 5.00/kg
- Adicionar segundo produto "Arroz 1kg", preço 6, quantidade 1, unidade kg → deve reordenar com o mais barato (R$ 5.00/kg) no topo, com badge "melhor custo"
- Tentar salvar produto com preço 0 → deve mostrar erro inline, não deve salvar
- Deslizar (swipe) um produto pra esquerda → deve mostrar botão "Excluir", tocar remove o produto da lista
- Voltar pra aba "Histórico" → deve mostrar a sessão "arroz" com contagem de produtos e melhor preço
- Fechar o app completamente e reabrir → histórico deve persistir (dado gravado no SQLite)

- [ ] **Step 5: Anotar a data de expiração do provisioning grátis**

Sem custo, o app expira ~7 dias após a instalação. Repita o Step 3 (`npx expo run:ios --device`) periodicamente pra manter o app funcionando no iPhone — não precisa refazer o prebuild a menos que dependências nativas mudem.

- [ ] **Step 6: Commit final (se houver ajustes do checklist)**

```bash
git add -A
git commit -m "chore: ajustes finais pós-verificação manual no device"
```

(Pule este commit se nenhum ajuste foi necessário.)

---

## Self-Review

**Cobertura da spec:**
- Entrada manual ✅ (Task 9, `AddProductForm`)
- Lista aberta por categoria ✅ (Task 13/14/15, sessão + histórico)
- 3 tipos de unidade (peso/volume/contagem) ✅ (Task 2, `units.ts`)
- Histórico local persistente ✅ (Task 6, `SqliteStorage`; Task 14, tela Histórico)
- Normalização e ranking ✅ (Tasks 2, 3, 7)
- Telas (Home/Histórico, Nova Sessão, Add Produto, Lista de Comparação) ✅ (Tasks 12–15)
- Validação de preço/quantidade/nome/categoria ✅ (Task 4, 9, 13)
- Empty states (sessão vazia, histórico vazio) ✅ (Task 14, 15)
- Swipe pra deletar ✅ (Task 15)
- Testes unit/integration/component com nomenclatura `deve X quando Y` ✅ (todas as tasks com teste)
- Instalação sem App Store ✅ (Task 16, rebuild grátis a cada 7 dias)

**Decisões documentadas fora do texto original da spec:**
- `SqliteStorage` não tem teste automatizado nativo (Task 6) — verificado manualmente na Task 16, decisão explicada inline.
- Telas (`app/(tabs)/*.tsx`, `app/session/[id].tsx`) não têm teste de componente dedicado — a lógica que importa já está coberta nos componentes/domain/store que elas consomem; risco residual coberto pelo checklist manual da Task 16.
