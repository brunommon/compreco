import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallPromptBanner } from '../install-prompt-banner';

describe('InstallPromptBanner', () => {
  it('mostra botão instalar quando o navegador dispara beforeinstallprompt', async () => {
    render(<InstallPromptBanner />);
    const prompt = jest.fn().mockResolvedValue(undefined);
    const evento = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
    window.dispatchEvent(evento);

    const botao = await screen.findByRole('button', { name: 'Instalar' });
    await userEvent.click(botao);

    expect(prompt).toHaveBeenCalled();
  });

  it('some quando o usuário fecha o aviso', async () => {
    render(<InstallPromptBanner />);
    window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: jest.fn() }));

    await userEvent.click(await screen.findByRole('button', { name: 'Fechar aviso' }));

    expect(screen.queryByRole('button', { name: 'Instalar' })).not.toBeInTheDocument();
  });
});
