import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Unit } from '../types';
import { COLORS } from '../theme/colors';

const UNIDADES: Unit[] = ['g', 'kg', 'ml', 'L', 'un'];

interface Props {
  value: Unit;
  onChange: (unidade: Unit) => void;
}

export function UnitPicker({ value, onChange }: Props): React.JSX.Element {
  return (
    <View style={styles.row} testID="unit-picker">
      {UNIDADES.map((u) => {
        const selecionado = value === u;
        return (
          <Pressable
            key={u}
            testID={`unit-chip-${u}`}
            onPress={() => onChange(u)}
            style={[styles.chip, selecionado && styles.chipSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: selecionado }}
            accessibilityLabel={`Unidade ${u}`}
          >
            <Text style={selecionado ? styles.textSelected : styles.text}>{u}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { color: COLORS.text },
  textSelected: { color: COLORS.primaryContrast, fontWeight: '600' },
});
