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
