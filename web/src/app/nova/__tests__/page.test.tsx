import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NovaSessaoPage from '../page';
import { InMemoryStorage } from '../../../db/in-memory-storage';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('../../../db/storage-provider', () => ({ getStorage: jest.fn() }));

import { getStorage } from '../../../db/storage-provider';

describe('NovaSessaoPage', () => {
  it('mostra erro quando categoria está vazia', async () => {
    render(<NovaSessaoPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }));
    expect(await screen.findByText('categoria é obrigatória')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it('cria sessão e navega pra tela da sessão', async () => {
    const storage = new InMemoryStorage();
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<NovaSessaoPage />);
    await userEvent.type(screen.getByLabelText(/Categoria/), 'Arroz');
    await userEvent.click(screen.getByRole('button', { name: 'Começar' }));

    const sessoes = await storage.listSessions();
    expect(sessoes).toHaveLength(1);
    expect(push).toHaveBeenCalledWith(`/session/${sessoes[0].id}`);
  });
});
