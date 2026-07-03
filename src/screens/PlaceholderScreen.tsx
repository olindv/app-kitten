import { StyleSheet, Text, View } from 'react-native';

export function PlaceholderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐱 Мой Котёнок</Text>
      <Text style={styles.subtitle}>Фаза 0 — фундамент готов</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7E6',
  },
  title: { fontSize: 36 },
  subtitle: { fontSize: 16, marginTop: 12, color: '#8A7B66' },
});
