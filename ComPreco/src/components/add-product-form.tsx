import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet } from 'react-native';
import { ProductInput, Unit } from '../types';
import { validarProduto } from '../domain/validation';
import { UnitPicker } from './unit-picker';

interface Props {
  onSubmit: (input: ProductInput) => void;
  onCancel?: () => void;
}

export function AddProductForm({ onSubmit, onCancel }: Props): React.JSX.Element {
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState<Unit>('un');
  const [erros, setErros] = useState<string[]>([]);

  function handleSubmit() {
    const precoNum = Number(preco.replace(',', '.'));
    const quantidadeNum = Number(quantidade.replace(',', '.'));
    const validationErrors = validarProduto({ nome, preco: precoNum, quantidade: quantidadeNum });

    if (validationErrors.length > 0) {
      setErros(validationErrors.map((e) => e.mensagem));
      return;
    }

    setErros([]);
    onSubmit({ nome, preco: precoNum, quantidade: quantidadeNum, unidade });
    setNome('');
    setPreco('');
    setQuantidade('');
  }

  return (
    <View style={styles.form}>
      <TextInput testID="input-nome" placeholder="Nome do produto" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput
        testID="input-preco"
        placeholder="Preço R$"
        value={preco}
        onChangeText={setPreco}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <TextInput
        testID="input-quantidade"
        placeholder="Quantidade"
        value={quantidade}
        onChangeText={setQuantidade}
        keyboardType="decimal-pad"
        style={styles.input}
      />
      <UnitPicker value={unidade} onChange={setUnidade} />
      {erros.map((erro) => (
        <Text key={erro} style={styles.erro}>
          {erro}
        </Text>
      ))}
      <View style={styles.acoes}>
        {onCancel && (
          <Pressable testID="botao-cancelar" onPress={onCancel} style={styles.botaoCancelar}>
            <Text style={styles.botaoCancelarTexto}>Cancelar</Text>
          </Pressable>
        )}
        <Pressable testID="botao-salvar" onPress={handleSubmit} style={styles.botao}>
          <Text style={styles.botaoTexto}>Salvar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 },
  erro: { color: '#c62828', fontSize: 13 },
  acoes: { flexDirection: 'row', gap: 12 },
  botao: { flex: 1, backgroundColor: '#2e7d32', padding: 12, borderRadius: 8, alignItems: 'center' },
  botaoTexto: { color: '#fff', fontWeight: '600' },
  botaoCancelar: { flex: 1, backgroundColor: '#eee', padding: 12, borderRadius: 8, alignItems: 'center' },
  botaoCancelarTexto: { color: '#333', fontWeight: '600' },
});
