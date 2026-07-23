import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NovaSessaoScreen from '../nova';
import { useSessionStore } from '../../../src/store/session-store';
import { InMemoryStorage } from '../../../src/db/in-memory-storage';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

function resetStore() {
  useSessionStore.setState({ storage: null, activeSession: null, products: [] });
}

describe('NovaSessaoScreen', () => {
  beforeEach(resetStore);

  it('deve limpar mensagem de erro ao digitar categoria válida após tentativa inválida', () => {
    useSessionStore.setState({ storage: new InMemoryStorage() });
    const { getByTestId, queryByText } = render(<NovaSessaoScreen />);

    fireEvent.press(getByTestId('botao-criar-sessao'));
    expect(queryByText('categoria é obrigatória')).toBeTruthy();

    fireEvent.changeText(getByTestId('input-categoria'), 'arroz');

    expect(queryByText('categoria é obrigatória')).toBeNull();
  });

  it('deve avisar quando storage ainda não está pronto em vez de manter erro antigo travado', async () => {
    resetStore();
    const { getByTestId, queryByText } = render(<NovaSessaoScreen />);

    fireEvent.press(getByTestId('botao-criar-sessao'));
    expect(queryByText('categoria é obrigatória')).toBeTruthy();

    fireEvent.changeText(getByTestId('input-categoria'), 'arroz');
    fireEvent.press(getByTestId('botao-criar-sessao'));

    await waitFor(() => {
      expect(queryByText('categoria é obrigatória')).toBeNull();
    });
  });
});
