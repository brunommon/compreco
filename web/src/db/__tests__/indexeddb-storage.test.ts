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
