import { StyleSheet, View } from 'react-native';

export function GameScreen() {
  return <View style={styles.container} testID="game-screen" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7E6' },
});
