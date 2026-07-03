import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { strings } from '../i18n/strings.ru';
import { currentStage, type QuestState } from '../quests/engine';
import { questById } from '../quests/registry';
import { useProgressStore } from '../store/progressStore';

function ProgressDots({ total, done }: { total: number; done: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          testID={i < done ? 'dot-filled' : 'dot-empty'}
          style={[styles.dot, i < done ? styles.dotFilled : styles.dotEmpty]}
        />
      ))}
    </View>
  );
}

function QuestCard({ state }: { state: QuestState }) {
  const def = questById(state.questId);
  const stage = currentStage(state);
  return (
    <View style={styles.card} testID={`journal-quest-${def.id}`}>
      <Text style={styles.questIcon}>{def.icon}</Text>
      <View style={styles.cardBody}>
        <Text style={styles.title}>{def.title}</Text>
        <ProgressDots total={stage.count} done={state.progress} />
      </View>
      <Text style={styles.sceneIcon}>{def.scene === 'home' ? '🏠' : '🌳'}</Text>
    </View>
  );
}

export function JournalModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const activeQuests = useProgressStore((s) => s.activeQuests);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerText}>📜 {strings.quests.journalTitle}</Text>
            <Pressable testID="journal-close" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          {activeQuests.map((q) => (
            <QuestCard key={q.questId} state={q} />
          ))}
        </View>
      </View>
    </Modal>
  );
}

// Кнопка закрытия и карточки ≥ 64dp (спека §1)
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(60,45,25,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: { backgroundColor: '#FFF7E6', borderRadius: 24, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerText: { fontSize: 22, fontWeight: '700', color: '#5C4A32' },
  close: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 26, color: '#5C4A32' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    minHeight: 72,
    borderWidth: 2,
    borderColor: '#EAD9B8',
  },
  cardBody: { flex: 1, gap: 8 },
  questIcon: { fontSize: 40 },
  sceneIcon: { fontSize: 22 },
  title: { fontSize: 15, color: '#5C4A32' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dotFilled: { backgroundColor: '#67B26F' },
  dotEmpty: { backgroundColor: '#E3D8C0', borderWidth: 1, borderColor: '#CBBD9E' },
});
