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

  it('deve resetar activeSession e products ao carregar outra sessão, sem exibir dados da sessão anterior', async () => {
    const storage = new InMemoryStorage();
    const sessaoA = await storage.createSession('arroz');
    await storage.addProduct(sessaoA.id, { nome: 'Arroz A', preco: 10, quantidade: 1, unidade: 'kg' });
    const sessaoB = await storage.createSession('feijão');
    await storage.addProduct(sessaoB.id, { nome: 'Feijão B', preco: 7, quantidade: 1, unidade: 'kg' });

    useSessionStore.getState().setStorage(storage);
    await useSessionStore.getState().loadSession(sessaoA.id);
    expect(useSessionStore.getState().activeSession?.id).toBe(sessaoA.id);

    // storage lento pra sessão B — o reset precisa acontecer de forma síncrona,
    // antes do fetch (getSession/listProducts) resolver
    let liberarSessaoB!: () => void;
    const travaSessaoB = new Promise<void>((resolve) => {
      liberarSessaoB = resolve;
    });
    const getSessionOriginal = storage.getSession.bind(storage);
    jest.spyOn(storage, 'getSession').mockImplementation(async (id) => {
      await travaSessaoB;
      return getSessionOriginal(id);
    });

    const carregamentoB = useSessionStore.getState().loadSession(sessaoB.id);

    // enquanto a promise de sessaoB ainda não resolveu, o estado já deve estar resetado —
    // nunca mostrando os dados stale da sessão A
    const estadoDuranteCarregamento = useSessionStore.getState();
    expect(estadoDuranteCarregamento.activeSession).toBeNull();
    expect(estadoDuranteCarregamento.products).toEqual([]);

    liberarSessaoB();
    await carregamentoB;

    const estadoFinal = useSessionStore.getState();
    expect(estadoFinal.activeSession?.id).toBe(sessaoB.id);
    expect(estadoFinal.products.map((p) => p.nome)).toEqual(['Feijão B']);
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
