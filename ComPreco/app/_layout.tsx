import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SqliteStorage } from '../src/db/sqlite-storage';
import { useSessionStore } from '../src/store/session-store';

export default function RootLayout() {
  const [pronto, setPronto] = useState(false);
  const setStorage = useSessionStore((s) => s.setStorage);

  useEffect(() => {
    SqliteStorage.open().then((storage) => {
      setStorage(storage);
      setPronto(true);
    });
  }, [setStorage]);

  if (!pronto) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text>Carregando...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ title: 'Comparação' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
