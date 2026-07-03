import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { clock } from '../app/clock';
import { Cat } from '../cat/Cat';
import { COAT_IDS, COLLAR_COLORS } from '../cat/coats';
import { randomKittenName } from '../cat/names';
import { strings } from '../i18n/strings.ru';
import { useNeedsStore } from '../store/needsStore';
import { useProfileStore } from '../store/profileStore';

export function CreateCatScreen() {
  const [coatIndex, setCoatIndex] = useState(0);
  const [collarColor, setCollarColor] = useState<string | null>(null);
  const [name, setName] = useState('');
  const createProfile = useProfileStore((s) => s.createProfile);
  const resetNeeds = useNeedsStore((s) => s.reset);

  const coatId = COAT_IDS[coatIndex];

  const start = () => {
    createProfile({ name: name.trim() || randomKittenName(), coatId, collarColor });
    resetNeeds(clock.now());
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{strings.createCat.title}</Text>

      <View style={styles.carousel}>
        <Pressable
          testID="coat-prev"
          style={styles.arrow}
          onPress={() => setCoatIndex((i) => (i + COAT_IDS.length - 1) % COAT_IDS.length)}
        >
          <Text style={styles.arrowText}>◀</Text>
        </Pressable>
        <Cat coatId={coatId} collarColor={collarColor} size={200} testID={`preview-${coatId}`} />
        <Pressable
          testID="coat-next"
          style={styles.arrow}
          onPress={() => setCoatIndex((i) => (i + 1) % COAT_IDS.length)}
        >
          <Text style={styles.arrowText}>▶</Text>
        </Pressable>
      </View>

      <View style={styles.collarRow}>
        <Pressable
          testID="collar-none"
          style={[styles.collarButton, styles.collarNone, collarColor === null && styles.selected]}
          onPress={() => setCollarColor(null)}
        >
          <Text style={styles.collarNoneText}>✕</Text>
        </Pressable>
        {COLLAR_COLORS.map((color) => (
          <Pressable
            key={color}
            testID={`collar-${color}`}
            style={[
              styles.collarButton,
              { backgroundColor: color },
              collarColor === color && styles.selected,
            ]}
            onPress={() => setCollarColor(color)}
          />
        ))}
      </View>

      <View style={styles.nameRow}>
        <TextInput
          testID="name-input"
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder={strings.createCat.namePlaceholder}
          maxLength={20}
        />
        <Pressable
          testID="random-name"
          style={styles.dice}
          onPress={() => setName(randomKittenName())}
        >
          <Text style={styles.diceText}>🎲</Text>
        </Pressable>
      </View>

      <Pressable testID="start-button" style={styles.startButton} onPress={start}>
        <Text style={styles.startText}>{strings.createCat.start}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Все интерактивные элементы ≥ 64dp (спека §1)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 16,
  },
  title: { fontSize: 28, color: '#5C4A32' },
  carousel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE3B3',
  },
  arrowText: { fontSize: 28, color: '#5C4A32' },
  collarRow: { flexDirection: 'row', gap: 12 },
  collarButton: { width: 64, height: 64, borderRadius: 32 },
  collarNone: {
    backgroundColor: '#F0E6D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collarNoneText: { fontSize: 24, color: '#8A7B66' },
  selected: { borderWidth: 4, borderColor: '#5C4A32' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nameInput: {
    width: 220,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 20,
    color: '#5C4A32',
  },
  dice: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE3B3',
  },
  diceText: { fontSize: 28 },
  startButton: {
    minWidth: 220,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#67B26F',
    paddingHorizontal: 32,
  },
  startText: { fontSize: 24, color: '#FFFFFF' },
});
