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
