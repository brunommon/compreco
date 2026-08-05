import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Product } from '../types';
import { unidadeBase } from '../domain/units';

interface Props {
  product: Product;
  melhorPreco: boolean;
}

export function ProductCard({ product, melhorPreco }: Props): React.JSX.Element {
  const base = unidadeBase(product.unidade);

  return (
    <View testID="product-card" style={[styles.card, melhorPreco && styles.cardMelhor]}>
      <Text style={styles.nome}>{product.nome}</Text>
      <Text style={styles.detalhe}>
        {product.quantidade}
        {product.unidade} · R$ {product.preco.toFixed(2)}
      </Text>
      <Text style={styles.destaque}>
        R$ {product.precoUnidadeBase.toFixed(2)}/{base}
      </Text>
      {melhorPreco && (
        <Text testID="badge-melhor" style={styles.badge}>
          melhor custo
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 8 },
  cardMelhor: { borderColor: '#2e7d32', backgroundColor: '#e8f5e9' },
  nome: { fontSize: 16, fontWeight: '600' },
  detalhe: { color: '#666', marginTop: 2 },
  destaque: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  badge: { color: '#2e7d32', fontWeight: '600', marginTop: 4 },
});
