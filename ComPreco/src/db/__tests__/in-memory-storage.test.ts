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
});
