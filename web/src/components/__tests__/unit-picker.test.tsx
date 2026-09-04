import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnitPicker } from '../unit-picker';

describe('UnitPicker', () => {
  it('marca a unidade selecionada e chama onChange ao trocar', async () => {
    const onChange = jest.fn();
    render(<UnitPicker value="kg" onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'kg' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'ml' }));

    expect(onChange).toHaveBeenCalledWith('ml');
  });
});
