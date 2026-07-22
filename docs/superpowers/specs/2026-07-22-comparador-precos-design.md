# ComPreco — Comparador de Preços por Unidade

**Data:** 2026-07-22
**Status:** Aprovado

## Objetivo

App iOS pessoal (uso próprio, sem publicação na App Store) pra comparar
produtos de supermercado com pesos/volumes/quantidades diferentes,
normalizando tudo pra uma base comum (R$/kg, R$/L ou R$/un), já que
comparar só o preço final ficou impossível com a variação de embalagens.

## Escopo (MVP)

- Entrada manual de dados (sem OCR, sem scan de código de barras)
- Comparação em lista aberta por categoria (N produtos por sessão, não par a par)
- Suporte a 3 tipos de unidade: peso (g/kg), volume (ml/L), contagem (un)
- Histórico local persistente de sessões passadas
- Uso single-user, single-device, sem sync cloud, sem multi-usuário

Fora de escopo (não agora): OCR/foto de etiqueta, scan de barcode,
sync entre dispositivos, catálogo de produtos/marcas, multi-usuário.

## Stack técnica

- Expo (React Native) + TypeScript
- `expo-sqlite` para persistência estruturada (sessions, products)
- `expo-router` com 2 abas: Nova Comparação / Histórico
- Zustand (ou Context simples) para state da sessão ativa
- Instalação: Xcode local direto no iPhone (Apple ID grátis) — rebuild
  necessário a cada ~7 dias (limite de provisioning grátis, sem custo
  de Apple Developer Program)

## Arquitetura de dados

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

## Normalização e cálculo

Toda quantidade é convertida pra unidade base do tipo:
- peso → base kg: `g -> kg` = valor / 1000; `kg -> kg` = valor * 1
- volume → base L: `ml -> L` = valor / 1000; `L -> L` = valor * 1
- contagem → base un: direto, sem conversão

`preco_unidade_base = preco / quantidade_normalizada`

Lista de produtos da sessão é ordenada por `preco_unidade_base` crescente
(menor primeiro = melhor custo-benefício).

## Fluxo de uso

1. Usuário cria sessão nova, dá nome de categoria (ex: "arroz")
2. Adiciona produtos um a um: nome, preço R$, quantidade, unidade
3. App recalcula ranking a cada produto adicionado, destaca o mais barato
4. Sessão fica salva no histórico local, consultável depois

## Telas

1. **Home / Histórico** (tab 1): lista sessões passadas (categoria, data,
   nº produtos, melhor preço), botão "+" pra nova sessão, tap reabre sessão
2. **Nova Sessão**: input categoria, botão "Adicionar produto"
3. **Add Produto** (modal/sheet): nome, preço R$, quantidade, seletor de
   unidade (chips: g/kg/ml/L/un)
4. **Lista de Comparação** (tela principal da sessão ativa): cards
   ordenados por menor preço/unidade base, badge "melhor custo" no topo,
   swipe pra deletar produto

Componentes reusáveis: `ProductCard`, `UnitPicker`, `AddProductForm`,
`SessionListItem`.

## Tratamento de erro / validação

- Preço: obrigatório, > 0 — bloqueia salvar, erro inline
- Quantidade: obrigatório, > 0 — bloqueia salvar, erro inline
- Nome do produto: obrigatório, não vazio
- Unidade: sempre tem default selecionado, nunca fica sem seleção
- Categoria da sessão: obrigatória pra criar sessão
- Divisão por zero: coberta pela validação de quantidade > 0
- Falha de SQLite (disco cheio/corrupção): try/catch na camada de
  storage, toast de erro, sem crash
- Sessão vazia (0 produtos): empty state, sem ranking quebrado
- Editar produto: mesma validação do add
- Deletar último produto da sessão: sessão continua existindo (vazia)
- Sem chamadas de rede — sem tratamento de erro de rede/timeout necessário

## Testes

**Unit (lógica pura)** — conversão de unidade, cálculo de preço por
unidade base, ordenação por ranking, validação de preço/quantidade > 0.

**Integration (storage)** — persistência de sessão/produto em SQLite
(em memória ou real em ambiente de teste), listagem por data, delete de
produto sem afetar sessão, recálculo de ranking ao adicionar produto.

**Component (React Native Testing Library)** — erro inline em preço
zero, destaque do card de menor preço, empty state, abertura do form de
add produto.

Cobertura alvo: 80% geral; lógica de normalização/ranking (crítica) mira
95%. Mocks restritos à camada de storage nos testes de componente —
lógica de cálculo nunca mockada.
