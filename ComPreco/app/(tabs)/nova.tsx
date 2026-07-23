import { useState } from 'react';
import { TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '../../src/store/session-store';
import { validarCategoria } from '../../src/domain/validation';
import { ScreenBackground } from '../../src/components/screen-background';

export default function NovaSessaoScreen() {
  const router = useRouter();
  const storage = useSessionStore((s) => s.storage);
  const [categoria, setCategoria] = useState('');
  const [erro, setErro] = useState('');

  function handleChangeCategoria(valor: string) {
    setCategoria(valor);
    if (erro !== '') setErro('');
  }

  async function criar() {
    const erros = validarCategoria(categoria);
    if (erros.length > 0) {
      setErro(erros[0]?.mensagem ?? '');
      return;
    }
    if (!storage) {
      setErro('Armazenamento ainda não está pronto. Aguarde um instante e tente novamente.');
      return;
    }
    const session = await storage.createSession(categoria);
    setCategoria('');
    setErro('');
    router.push(`/session/${session.id}`);
  }

  return (
    <ScreenBackground style={styles.container}>
      <TextInput
        testID="input-categoria"
        placeholder="Categoria (ex: arroz)"
        value={categoria}
        onChangeText={handleChangeCategoria}
        style={styles.input}
      />
      {erro !== '' && <Text style={styles.erro}>{erro}</Text>}
      <Pressable testID="botao-criar-sessao" onPress={criar} style={styles.botao}>
        <Text style={styles.botaoTexto}>Criar comparação</Text>
      </Pressable>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  erro: { color: '#c62828' },
  botao: { backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600' },
});
