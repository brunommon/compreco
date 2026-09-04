import { render, screen } from '@testing-library/react';
import { BottomNav } from '../bottom-nav';

jest.mock('next/navigation', () => ({
  usePathname: () => '/nova',
}));

describe('BottomNav', () => {
  it('marca o link ativo conforme a rota atual', () => {
    render(<BottomNav />);
    expect(screen.getByRole('link', { name: 'Nova' })).toHaveClass('font-semibold');
    expect(screen.getByRole('link', { name: 'Histórico' })).not.toHaveClass('font-semibold');
  });
});
