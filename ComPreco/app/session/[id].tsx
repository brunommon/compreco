import { useEffect, useState } from 'react';
import { View, FlatList, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useSessionStore } from '../../src/store/session-store';
import { ProductCard } from '../../src/components/product-card';
import { AddProductForm } from '../../src/components/add-product-form';

export default function SessaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loadSession = useSessionStore((s) => s.loadSession);
  const addProduct = useSessionStore((s) => s.addProduct);
  const removeProduct = useSessionStore((s) => s.removeProduct);
  const products = useSessionStore((s) => s.products);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    if (id) loadSession(id);
  }, [id, loadSession]);

  return (
    <View style={styles.container}>
      {products.length === 0 ? (
        <Text style={styles.empty}>Adicione um produto pra comparar.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item, index }) => (
            <Swipeable
              renderRightActions={() => (
                <Pressable onPress={() => removeProduct(item.id)} style={styles.deleteAction}>
                  <Text style={styles.deleteText}>Excluir</Text>
                </Pressable>
              )}
            >
              <ProductCard product={item} melhorPreco={index === 0} />
            </Swipeable>
          )}
        />
      )}
      <Pressable testID="botao-add-produto" onPress={() => setModalAberto(true)} style={styles.fab}>
        <Text style={styles.fabTexto}>+ Adicionar produto</Text>
      </Pressable>
      <Modal visible={modalAberto} animationType="slide">
        <AddProductForm
          onSubmit={async (input) => {
            await addProduct(input);
            setModalAberto(false);
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  empty: { padding: 24, textAlign: 'center', color: '#666' },
  fab: { backgroundColor: '#2e7d32', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  fabTexto: { color: '#fff', fontWeight: '600' },
  deleteAction: { backgroundColor: '#c62828', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 10, marginBottom: 8 },
  deleteText: { color: '#fff', fontWeight: '600' },
});
