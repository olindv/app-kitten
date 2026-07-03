import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cat } from '../cat/Cat';
import { COAT_IDS } from '../cat/coats';

// Временная галерея окрасов для утверждения прототипа владельцем (риск из спеки §11).
// Удаляется в задаче о навигации.
export function PlaceholderScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {COAT_IDS.map((coatId) => (
        <View key={coatId} style={styles.cell}>
          <Cat coatId={coatId} collarColor="#E4572E" size={150} testID={`gallery-${coatId}`} />
          <Text style={styles.label}>{coatId}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFF7E6',
  },
  cell: { alignItems: 'center', margin: 8 },
  label: { fontSize: 12, color: '#8A7B66' },
});
