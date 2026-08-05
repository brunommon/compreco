import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HistoricoScreen from '../index';
import { useSessionStore } from '../../../src/store/session-store';
import { InMemoryStorage } from '../../../src/db/in-memory-storage';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: (effect: () => void) => {
    const React = require('react');
    React.useEffect(effect, []);
  },
}));

function renderScreen() {
  return render(
    <GestureHandlerRootView>
      <HistoricoScreen />
    </GestureHandlerRootView>
  );
}

function resetStore() {
  useSessionStore.setState({ storage: null, activeSession: null, products: [] });
}

describe('HistoricoScreen', () => {
  beforeEach(resetStore);

  it('deve remover a comparação da lista e do storage ao excluir', async () => {
    const storage = new InMemoryStorage();
    const sessao = await storage.createSession('arroz');
    useSessionStore.setState({ storage });

    const { getByText, queryByText, getByTestId } = renderScreen();

    await waitFor(() => expect(getByText('arroz')).toBeTruthy());

    fireEvent.press(getByTestId(`botao-excluir-sessao-${sessao.id}`));

    await waitFor(() => expect(queryByText('arroz')).toBeNull());
    expect(await storage.getSession(sessao.id)).toBeNull();
  });
});
