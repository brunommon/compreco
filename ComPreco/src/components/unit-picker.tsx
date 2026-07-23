import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Unit } from '../types';

const UNIDADES: Unit[] = ['g', 'kg', 'ml', 'L', 'un'];

interface Props {
  value: Unit;
  onChange: (unidade: Unit) => void;
}

export function UnitPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row} testID="unit-picker">
      {UNIDADES.map((u) => (
        <Pressable
          key={u}
          testID={`unit-chip-${u}`}
          onPress={() => onChange(u)}
          style={[styles.chip, value === u && styles.chipSelected]}
        >
          <Text style={value === u ? styles.textSelected : styles.text}>{u}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: '#ccc' },
  chipSelected: { backgroundColor: '#2e7d32', borderColor: '#2e7d32' },
  text: { color: '#333' },
  textSelected: { color: '#fff', fontWeight: '600' },
});
