import { useCallback, useState } from 'react';
import { FlatList, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
          <SessionListItem
            session={item}
            totalProdutos={resumos[item.id]?.total ?? 0}
            melhorPreco={resumos[item.id]?.melhor ?? null}
            onPress={() => router.push(`/session/${item.id}`)}
          />
        )}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 24, textAlign: 'center', color: '#666' },
});
