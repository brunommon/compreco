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
