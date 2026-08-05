import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddProductForm } from '../add-product-form';

describe('AddProductForm', () => {
  it('deve mostrar erro inline quando salva produto com preço zero', () => {
    const { getByTestId, getByText } = render(<AddProductForm onSubmit={jest.fn()} />);

    fireEvent.changeText(getByTestId('input-nome'), 'Arroz');
    fireEvent.changeText(getByTestId('input-preco'), '0');
    fireEvent.changeText(getByTestId('input-quantidade'), '5');
    fireEvent.press(getByTestId('botao-salvar'));

    expect(getByText('preço deve ser maior que zero')).toBeTruthy();
  });

  it('deve chamar onSubmit com dados corretos quando formulário é válido', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<AddProductForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('input-nome'), 'Arroz 5kg');
    fireEvent.changeText(getByTestId('input-preco'), '25');
    fireEvent.changeText(getByTestId('input-quantidade'), '5');
    fireEvent.press(getByTestId('unit-chip-kg'));
    fireEvent.press(getByTestId('botao-salvar'));

    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Arroz 5kg', preco: 25, quantidade: 5, unidade: 'kg' });
  });

  it('deve não chamar onSubmit quando nome está vazio', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(<AddProductForm onSubmit={onSubmit} />);

    fireEvent.changeText(getByTestId('input-preco'), '10');
    fireEvent.changeText(getByTestId('input-quantidade'), '1');
    fireEvent.press(getByTestId('botao-salvar'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('deve chamar onCancel e não onSubmit quando toca em cancelar', () => {
    const onSubmit = jest.fn();
    const onCancel = jest.fn();
    const { getByTestId } = render(<AddProductForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.changeText(getByTestId('input-nome'), 'Arroz');
    fireEvent.press(getByTestId('botao-cancelar'));

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
