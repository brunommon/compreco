import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProductForm } from '../add-product-form';
import { BottomNav } from '../bottom-nav';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('AddProductForm', () => {
  it('fica acima do BottomNav (z-index maior) para o botão Salvar não ficar coberto', () => {
    render(
      <>
        <AddProductForm onSubmit={jest.fn()} onCancel={jest.fn()} />
        <BottomNav />
      </>,
    );

    const form = screen.getByRole('button', { name: 'Salvar' }).closest('form');
    const nav = screen.getByRole('navigation');

    expect(form).toHaveClass('z-40');
    expect(nav).toHaveClass('z-30');
  });

  it('mostra erro inline e não chama onSubmit quando preço é zero', async () => {
    const onSubmit = jest.fn();
    render(<AddProductForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Produto'), 'Arroz');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '0');
    await userEvent.type(screen.getByLabelText('Quantidade'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByText('preço deve ser maior que zero')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('chama onSubmit com os dados quando válido', async () => {
    const onSubmit = jest.fn();
    render(<AddProductForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Produto'), 'Arroz 5kg');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '25');
    await userEvent.type(screen.getByLabelText('Quantidade'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'ml' }));
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Arroz 5kg', preco: 25, quantidade: 5, unidade: 'ml' });
  });

  it('aceita vírgula como separador decimal no preço (teclado numérico PT-BR)', async () => {
    const onSubmit = jest.fn();
    render(<AddProductForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Produto'), 'Arroz 5kg');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '4,55');
    await userEvent.type(screen.getByLabelText('Quantidade'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Arroz 5kg', preco: 4.55, quantidade: 1, unidade: 'kg' });
    expect(screen.queryByText('preço deve ser maior que zero')).not.toBeInTheDocument();
  });

  it('aceita vírgula como separador decimal na quantidade', async () => {
    const onSubmit = jest.fn();
    render(<AddProductForm onSubmit={onSubmit} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByLabelText('Produto'), 'Azeite');
    await userEvent.type(screen.getByLabelText('Preço (R$)'), '10');
    await userEvent.type(screen.getByLabelText('Quantidade'), '1,5');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Azeite', preco: 10, quantidade: 1.5, unidade: 'kg' });
    expect(screen.queryByText('quantidade deve ser maior que zero')).not.toBeInTheDocument();
  });
});
