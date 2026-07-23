import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SessionListItem } from '../session-list-item';
import { Session } from '../../types';

const sessao: Session = { id: '1', categoria: 'Arroz', criadoEm: '2026-07-22T10:00:00.000Z' };

describe('SessionListItem', () => {
  it('deve chamar onPress ao tocar o item', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <SessionListItem session={sessao} totalProdutos={3} melhorPreco={5.2} onPress={onPress} />
    );

    fireEvent.press(getByTestId('session-item'));

    expect(onPress).toHaveBeenCalled();
  });

  it('deve mostrar contagem de produtos no plural', () => {
    const { getByText } = render(
      <SessionListItem session={sessao} totalProdutos={3} melhorPreco={5.2} onPress={jest.fn()} />
    );
    expect(getByText('3 produtos · melhor R$ 5.20')).toBeTruthy();
  });

  it('deve mostrar contagem de produtos no singular', () => {
    const { getByText } = render(
      <SessionListItem session={sessao} totalProdutos={1} melhorPreco={5.2} onPress={jest.fn()} />
    );
    expect(getByText('1 produto · melhor R$ 5.20')).toBeTruthy();
  });

  it('deve omitir melhor preço quando null', () => {
    const { getByText } = render(
      <SessionListItem session={sessao} totalProdutos={0} melhorPreco={null} onPress={jest.fn()} />
    );
    expect(getByText('0 produtos')).toBeTruthy();
  });
});
