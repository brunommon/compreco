import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Session } from '../types';

interface Props {
  session: Session;
  totalProdutos: number;
  melhorPreco: number | null;
  onPress: () => void;
}

export function SessionListItem({ session, totalProdutos, melhorPreco, onPress }: Props): React.JSX.Element {
  const contagem = `${totalProdutos} produto${totalProdutos !== 1 ? 's' : ''}`;
  const sufixo = melhorPreco !== null ? ` · melhor R$ ${melhorPreco.toFixed(2)}` : '';

  return (
    <Pressable testID="session-item" onPress={onPress} style={styles.item}>
      <Text style={styles.categoria}>{session.categoria}</Text>
      <Text style={styles.meta}>
        {contagem}
        {sufixo}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  categoria: { fontSize: 16, fontWeight: '600' },
  meta: { color: '#666', marginTop: 2 },
});
