# ComPreco: Comparador de Preços por Unidade

**Domínio Hemera:** D2 Operations (utilitário pessoal)

## Objetivo

App pessoal para comparar produtos de supermercado com pesos, volumes ou quantidades
diferentes. Ele converte tudo para uma base comum (R$/kg, R$/L ou R$/un) e guarda o
histórico das comparações no próprio aparelho. Uso individual, sem conta e sem
sincronização na nuvem.

## Stack

Next.js (TypeScript) como PWA · Serwist (offline) · Zustand · IndexedDB (`idb`) · Jest.
O código fica na pasta `web/`.

## Como rodar localmente

```bash
cd web
npm install
npm run dev     # http://localhost:3000
```

Verificações:

```bash
npm test
npm run lint
npm run build
```

## Variáveis de ambiente

Nenhuma. Os dados ficam só no navegador do aparelho.

## Documentação adicional

- `docs/superpowers/specs/`: design do MVP e da migração para PWA
- `docs/superpowers/plans/`: planos de implementação
- `web/AGENTS.md`: instruções para agentes de código
