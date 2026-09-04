import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddProductForm } from '../add-product-form';

describe('AddProductForm', () => {
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
});
