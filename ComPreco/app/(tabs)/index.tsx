import { useCallback, useState } from 'react';
import { FlatList, Text, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { useSessionStore } from '../../src/store/session-store';
import { SessionListItem } from '../../src/components/session-list-item';
import { ScreenBackground } from '../../src/components/screen-background';
import { Session } from '../../src/types';

interface Resumo {
  total: number;
  melhor: number | null;
}

export default function HistoricoScreen() {
  const router = useRouter();
  const storage = useSessionStore((s) => s.storage);
  const [sessoes, setSessoes] = useState<Session[]>([]);
  const [resumos, setResumos] = useState<Record<string, Resumo>>({});

  useFocusEffect(
    useCallback(() => {
      if (!storage) return;
      storage.listSessions().then(async (lista) => {
        setSessoes(lista);
        const entradas = await Promise.all(
          lista.map(async (s): Promise<[string, Resumo]> => {
            const produtos = await storage.listProducts(s.id);
            const melhor = produtos.length > 0 ? Math.min(...produtos.map((p) => p.precoUnidadeBase)) : null;
            return [s.id, { total: produtos.length, melhor }];
          })
        );
        setResumos(Object.fromEntries(entradas));
      });
    }, [storage])
  );

  async function excluirSessao(id: string) {
    if (!storage) return;
    await storage.deleteSession(id);
    setSessoes((atual) => atual.filter((s) => s.id !== id));
    setResumos((atual) => {
      const { [id]: _removido, ...resto } = atual;
      return resto;
    });
  }

  if (sessoes.length === 0) {
    return (
      <ScreenBackground>
        <Text style={styles.empty}>Nenhuma comparação ainda. Toque em &quot;Nova Comparação&quot;.</Text>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <FlatList
        data={sessoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <Pressable
                testID={`botao-excluir-sessao-${item.id}`}
                onPress={() => excluirSessao(item.id)}
                style={styles.deleteAction}
              >
                <Text style={styles.deleteText}>Excluir</Text>
              </Pressable>
            )}
          >
            <SessionListItem
              session={item}
              totalProdutos={resumos[item.id]?.total ?? 0}
              melhorPreco={resumos[item.id]?.melhor ?? null}
              onPress={() => router.push(`/session/${item.id}`)}
            />
          </Swipeable>
        )}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 24, textAlign: 'center', color: '#666' },
  deleteAction: { backgroundColor: '#c62828', justifyContent: 'center', paddingHorizontal: 20 },
  deleteText: { color: '#fff', fontWeight: '600' },
});
