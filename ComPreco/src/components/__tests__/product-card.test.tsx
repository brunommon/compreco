import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductCard } from '../product-card';
import { Product } from '../../types';

const produto: Product = {
  id: '1',
  sessionId: 's1',
  nome: 'Arroz 5kg',
  preco: 25,
  quantidade: 5,
  unidade: 'kg',
  precoUnidadeBase: 5,
};

describe('ProductCard', () => {
  it('deve mostrar badge de melhor custo quando melhorPreco é true', () => {
    const { getByTestId } = render(<ProductCard product={produto} melhorPreco />);
    expect(getByTestId('badge-melhor')).toBeTruthy();
  });

  it('deve não mostrar badge quando melhorPreco é false', () => {
    const { queryByTestId } = render(<ProductCard product={produto} melhorPreco={false} />);
    expect(queryByTestId('badge-melhor')).toBeNull();
  });

  it('deve mostrar preço por unidade base formatado', () => {
    const { getByText } = render(<ProductCard product={produto} melhorPreco={false} />);
    expect(getByText('R$ 5.00/kg')).toBeTruthy();
  });
});
