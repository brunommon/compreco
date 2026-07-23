import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Histórico' }} />
      <Tabs.Screen name="nova" options={{ title: 'Nova Comparação' }} />
    </Tabs>
  );
}
