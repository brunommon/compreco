import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoricoPage from '../page';
import { InMemoryStorage } from '../../db/in-memory-storage';

jest.mock('../../db/storage-provider', () => ({
  getStorage: jest.fn(),
}));

import { getStorage } from '../../db/storage-provider';

describe('HistoricoPage', () => {
  it('mostra estado vazio quando não há sessões', async () => {
    const storage = new InMemoryStorage();
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<HistoricoPage />);

    expect(await screen.findByText(/Nenhuma comparação ainda/)).toBeInTheDocument();
  });

  it('lista sessões existentes', async () => {
    const storage = new InMemoryStorage();
    await storage.createSession('Arroz');
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<HistoricoPage />);

    expect(await screen.findByText('Arroz')).toBeInTheDocument();
  });

  it('remove a sessão da lista ao clicar em Remover e confirmar', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    const storage = new InMemoryStorage();
    await storage.createSession('Arroz');
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<HistoricoPage />);

    expect(await screen.findByText('Arroz')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remover Arroz' }));

    expect(screen.queryByText('Arroz')).not.toBeInTheDocument();
    expect(await screen.findByText(/Nenhuma comparação ainda/)).toBeInTheDocument();
    expect(await storage.listSessions()).toHaveLength(0);

    jest.restoreAllMocks();
  });

  it('não remove a sessão quando o usuário cancela a confirmação', async () => {
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    const storage = new InMemoryStorage();
    await storage.createSession('Arroz');
    (getStorage as jest.Mock).mockResolvedValue(storage);

    render(<HistoricoPage />);

    expect(await screen.findByText('Arroz')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remover Arroz' }));

    expect(screen.getByText('Arroz')).toBeInTheDocument();
    expect(await storage.listSessions()).toHaveLength(1);

    jest.restoreAllMocks();
  });
});
