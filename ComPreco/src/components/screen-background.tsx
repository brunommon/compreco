import React from 'react';
import { Image, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ScreenBackground({ children, style }: Props): React.JSX.Element {
  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/background-top.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef3fb' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  content: { flex: 1, backgroundColor: 'rgba(255,255,255,0.85)' },
});
