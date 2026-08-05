import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UnitPicker } from '../unit-picker';

describe('UnitPicker', () => {
  it('deve chamar onChange com a unidade correta ao tocar um chip', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(<UnitPicker value="un" onChange={onChange} />);

    fireEvent.press(getByTestId('unit-chip-kg'));

    expect(onChange).toHaveBeenCalledWith('kg');
  });

  it('deve renderizar todos os chips de unidade', () => {
    const { getByTestId } = render(<UnitPicker value="un" onChange={jest.fn()} />);

    expect(getByTestId('unit-chip-g')).toBeTruthy();
    expect(getByTestId('unit-chip-kg')).toBeTruthy();
    expect(getByTestId('unit-chip-ml')).toBeTruthy();
    expect(getByTestId('unit-chip-L')).toBeTruthy();
    expect(getByTestId('unit-chip-un')).toBeTruthy();
  });

  it('deve marcar o chip selecionado como selected pra acessibilidade', () => {
    const { getByTestId } = render(<UnitPicker value="kg" onChange={jest.fn()} />);

    expect(getByTestId('unit-chip-kg').props.accessibilityState).toEqual({ selected: true });
    expect(getByTestId('unit-chip-g').props.accessibilityState).toEqual({ selected: false });
  });
});
