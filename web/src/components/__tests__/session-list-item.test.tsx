import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByText('Arroz')).toBeInTheDocument();
    expect(screen.getByText('2 produtos')).toBeInTheDocument();
    expect(screen.getByText('R$ 8.00')).toBeInTheDocument();
  });

  it('não mostra preço quando não há produtos', () => {
    render(<SessionListItem session={session} produtos={[]} onDelete={jest.fn()} />);
    expect(screen.getByText('0 produtos')).toBeInTheDocument();
    expect(screen.queryByText(/^R\$/)).not.toBeInTheDocument();
  });

  it('chama onDelete com o id da sessão ao clicar em Remover', async () => {
    const onDelete = jest.fn();
    render(<SessionListItem session={session} produtos={[]} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remover Arroz' }));
    expect(onDelete).toHaveBeenCalledWith('s1');
  });

  it('clicar em Remover não navega (link não é acionado)', async () => {
    const onDelete = jest.fn();
    render(<SessionListItem session={session} produtos={[]} onDelete={onDelete} />);
    const botao = screen.getByRole('button', { name: 'Remover Arroz' });
    const evento = createEvent.click(botao);
    const preventDefaultSpy = jest.spyOn(evento, 'preventDefault');
    fireEvent(botao, evento);
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith('s1');
  });

  it('chama onDelete ao arrastar além do limite de swipe', () => {
    const onDelete = jest.fn();
    const { container } = render(<SessionListItem session={session} produtos={[]} onDelete={onDelete} />);
    const card = container.firstChild as HTMLElement;

    fireEvent.pointerDown(card, { clientX: 200 });
    fireEvent.pointerMove(card, { clientX: 100 });
    fireEvent.pointerUp(card);

    expect(onDelete).toHaveBeenCalledWith('s1');
  });
});
