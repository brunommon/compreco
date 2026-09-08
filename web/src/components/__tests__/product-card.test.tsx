import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from '../product-card';
import { Product } from '../../types';

const produto: Product = { id: '1', sessionId: 's1', nome: 'Arroz', preco: 10, quantidade: 1, unidade: 'kg', precoUnidadeBase: 10 };

describe('ProductCard', () => {
  it('mostra badge de melhor custo quando melhor=true', () => {
    render(<ProductCard product={produto} melhor onDelete={jest.fn()} />);
    expect(screen.getByText('melhor custo')).toBeInTheDocument();
  });

  it('chama onDelete ao clicar no botão remover', async () => {
    const onDelete = jest.fn();
    render(<ProductCard product={produto} melhor={false} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remover Arroz' }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('chama onDelete ao arrastar além do limite de swipe', () => {
    const onDelete = jest.fn();
    const { container } = render(<ProductCard product={produto} melhor={false} onDelete={onDelete} />);
    const card = container.firstChild as HTMLElement;

    fireEvent.pointerDown(card, { clientX: 200 });
    fireEvent.pointerMove(card, { clientX: 100 });
    fireEvent.pointerUp(card);

    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('mostra o preço por kg (não por g) quando o produto foi cadastrado em gramas', () => {
    const produtoEmGramas: Product = { ...produto, unidade: 'g', quantidade: 500, precoUnidadeBase: 20 };
    render(<ProductCard product={produtoEmGramas} melhor={false} onDelete={jest.fn()} />);
    expect(screen.getByText(/R\$ 20\.00\/kg/)).toBeInTheDocument();
    expect(screen.queryByText(/R\$ 20\.00\/g$/)).not.toBeInTheDocument();
  });

  it('pointercancel reseta o arrasto sem apagar o produto', () => {
    const onDelete = jest.fn();
    const { container } = render(<ProductCard product={produto} melhor={false} onDelete={onDelete} />);
    const card = container.firstChild as HTMLElement;

    fireEvent.pointerDown(card, { clientX: 200 });
    fireEvent.pointerMove(card, { clientX: 100 });
    fireEvent.pointerCancel(card);
    fireEvent.pointerUp(card);

    expect(onDelete).not.toHaveBeenCalled();
    expect(card).toHaveStyle({ transform: 'translateX(0px)' });
  });
});
