import { render, screen } from '@testing-library/react';
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
});
