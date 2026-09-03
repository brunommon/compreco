# ComPreco — Migração para PWA (Next.js + Vercel)

**Data:** 2026-09-03
**Status:** Aprovado

## Objetivo

Substituir o app iOS atual (Expo/React Native, instalado via Xcode com
provisioning grátis que expira a cada ~7 dias) por um PWA (site que se
instala como app) rodando em Next.js e publicado na Vercel. Objetivos:
funcionar em qualquer plataforma com navegador (iPhone, Android,
desktop), eliminar a instalação manual e a expiração, e ter
comportamento de interface pensado pra celular — não uma versão
reduzida do desktop.

## Escopo

- Reescrita completa da camada de UI e de persistência
- Mantém 100% das regras de negócio já existentes (ranking, validação,
  conversão de unidade) — só migra o "encaixe" (interface/camada), não a lógica
- Dado continua só local (IndexedDB no navegador), sem login, sem sync
  entre aparelhos, sem backend — mesma filosofia do app atual
- PWA instalável, funciona offline (fora do ar sem internet)
- Interface mobile-first com comportamento de app nativo (navegação
  por baixo, gestos de deslizar, teclado numérico, vibração)
- Desktop funciona (não quebra), mas não recebe layout dedicado

Fora de escopo (não agora): conta de usuário, sync entre dispositivos,
notificação push, OCR/scan de código de barras, catálogo de produtos,
app nativo publicado em loja (App Store/Play Store).

## Stack técnica

- Next.js (App Router) + TypeScript, hospedado na Vercel
- Tailwind CSS + shadcn/ui como base de componentes, customizados pra
  mobile-first (botões grandes, navegação por baixo)
- `idb` (wrapper fino sobre IndexedDB) pra persistência — mantém a
  mesma forma de interface que hoje existe em `src/db/types.ts`,
  trocando só a implementação (SQLite → IndexedDB)
- Zustand pro state da sessão ativa (mesmo já usado hoje)
- Serwist (gera service worker + manifest) pra tornar o site instalável
  e funcionar offline
- Jest + Testing Library (`@testing-library/react`) pros testes —
  mesma ferramenta de hoje, trocando só o alvo (React web em vez de
  React Native)

## Arquitetura de dados

Mesma estrutura de hoje (ver spec anterior
`2026-07-22-comparador-precos-design.md`), agora persistida em
IndexedDB em vez de SQLite:

```
Session
- id
- categoria (texto livre, ex: "arroz")
- criado_em

Product
- id
- session_id (FK -> Session)
- nome
- preco (decimal, R$)
- quantidade (decimal)
- unidade (enum: g | kg | ml | L | un)
- preco_unidade_base (calculado, não editável diretamente)
```

Duas "tabelas" (object stores) no IndexedDB: `sessions` e `products`,
com índice em `products.session_id` pra listar produtos de uma sessão
sem varrer tudo.

## Normalização e cálculo

Sem mudança — `src/domain/ranking.ts`, `src/domain/units.ts` e
`src/domain/validation.ts` são lógica pura (TypeScript sem
dependência de React Native) e migram praticamente sem alteração.

## Migração do código atual

**Aproveita quase sem mudar:**
- `src/domain/*` (ranking, unidades, validação)
- `src/store/session-store.ts` (Zustand — mesma lib, mesma lógica)

**Reescreve mantendo a mesma interface:**
- `src/db/sqlite-storage.ts` → novo `src/db/indexeddb-storage.ts`,
  implementando o mesmo contrato de `src/db/types.ts`
- `src/db/in-memory-storage.ts` migra quase direto (não depende de
  plataforma), útil pros testes igual hoje

**Reescreve do zero (React Native → React web):**
- Todas as telas (`app/`) e componentes visuais (`ProductCard`,
  `UnitPicker`, `AddProductForm`, `SessionListItem`) — JSX de React
  Native não roda em React web, mas a lógica de cada componente
  (o que ele recebe, o que ele faz) se mantém igual

O app Expo atual continua funcionando em paralelo até o PWA cobrir as
mesmas telas — sem prazo fixo de desligar, decide na hora que o PWA
estiver em paridade de uso.

## PWA e modo offline

- Manifesto (`manifest.json`) com ícone, nome, cor de tema — permite
  "Adicionar à tela de início"
- Service worker (via Serwist) cacheia o app shell (HTML/CSS/JS) no
  primeiro acesso — abre e funciona mesmo sem internet, importante
  porque o uso real é dentro de mercado com sinal ruim
- Banner de instalação: aparece sozinho quando o navegador permite
  (`beforeinstallprompt` no Android/desktop; no iPhone o Safari não
  tem esse gatilho automático — mostra instrução manual "Adicionar à
  Tela de Início" na primeira visita)

## Fluxo de uso

Sem mudança em relação ao app atual:

1. Usuário cria sessão nova, dá nome de categoria (ex: "arroz")
2. Adiciona produtos um a um: nome, preço R$, quantidade, unidade
3. App recalcula ranking a cada produto adicionado, destaca o mais barato
4. Sessão fica salva no histórico local, consultável depois

## Telas e comportamento mobile-first

Duas rotas principais + uma dinâmica, navegação por barra inferior
(bottom nav) fixa:

1. **Histórico** (`/`): lista sessões passadas (categoria, data, nº
   produtos, melhor preço). Botão de "+" flutuante no canto inferior
   (fácil alcance com o polegar) pra criar sessão nova. Tap reabre sessão.
2. **Nova Sessão** (`/nova`): input de categoria, segue direto pra tela
   de comparação já criada
3. **Comparação/Sessão** (`/session/[id]`): lista de produtos ordenada
   por menor preço/unidade base, badge "melhor custo" no topo, botão
   pra adicionar produto abre formulário em bottom sheet (painel que
   sobe de baixo, não modal centralizado)

Comportamentos específicos de mobile (não são versão encolhida do
desktop):
- Navegação por barra inferior, não menu lateral
- Botões grandes, uma ação em foco por tela
- Deslizar o dedo (swipe) no card do produto pra deletar, com
  confirmação visual (cor vermelha ao arrastar)
- Campo de preço/quantidade abre teclado numérico direto
  (`inputMode="decimal"`), nunca teclado de letras
- Vibração curta (`navigator.vibrate`, quando suportado) ao salvar
  produto ou deletar
- Área de toque respeita a barra de gestos do iPhone (`safe-area-inset`)

**Desktop:** mesmas telas, uma coluna centralizada com largura máxima,
sem sidebar nem layout multi-coluna dedicado.

Componentes reusáveis: `ProductCard`, `UnitPicker`, `AddProductForm`,
`SessionListItem`, `BottomNav`.

## Tratamento de erro / validação

Mesmas regras do app atual, adaptadas pro novo storage:

- Preço: obrigatório, > 0 — bloqueia salvar, erro inline
- Quantidade: obrigatório, > 0 — bloqueia salvar, erro inline
- Nome do produto: obrigatório, não vazio
- Unidade: sempre tem default selecionado, nunca fica sem seleção
- Categoria da sessão: obrigatória pra criar sessão
- Divisão por zero: coberta pela validação de quantidade > 0
- Falha de IndexedDB (navegador sem suporte, quota cheia, modo
  privado que bloqueia storage): try/catch na camada de storage,
  toast de erro, sem crash — fallback pra storage em memória
  (perde dado ao fechar aba, mas não trava o app)
- Sessão vazia (0 produtos): empty state, sem ranking quebrado
- Editar produto: mesma validação do add
- Deletar último produto da sessão: sessão continua existindo (vazia)
- Service worker falhar ao registrar (navegador antigo/sem suporte):
  app funciona normal online, só não fica instalável/offline
- Sem chamadas de rede pra dados — sem tratamento de erro de
  rede/timeout necessário pra essa parte

## Testes

**Unit (lógica pura)** — mesma suíte de hoje: conversão de unidade,
cálculo de preço por unidade base, ordenação por ranking, validação
de preço/quantidade > 0. Migra sem alteração de conteúdo.

**Integration (storage)** — persistência de sessão/produto em
IndexedDB (usando `fake-indexeddb` em ambiente de teste), listagem
por data, delete de produto sem afetar sessão, recálculo de ranking
ao adicionar produto, fallback pra storage em memória quando
IndexedDB falha.

**Component (Testing Library)** — erro inline em preço zero, destaque
do card de menor preço, empty state, abertura do bottom sheet de add
produto, navegação pela barra inferior.

Cobertura alvo: 80% geral; lógica de normalização/ranking (crítica)
mira 95%. Mocks restritos à camada de storage nos testes de
componente — lógica de cálculo nunca mockada.

## Deploy

- Repositório conectado na Vercel — build e deploy automático a cada
  push
- Push em branch feature: gera link de preview pra testar antes de ir
  pra produção
- Push na `main`: vai pra produção
- Sem variável de ambiente obrigatória (sem backend, sem chave de API)
