import { clock } from '../../app/clock';
import { initialActiveQuests } from '../../quests/engine';
import { localDayString, useProgressStore } from '../progressStore';

beforeEach(() => {
  useProgressStore.setState({
    stars: 0,
    playDays: [],
    activeQuests: initialActiveQuests(),
    completedLog: [],
    celebration: null,
  });
});

test('localDayString — локальная дата YYYY-MM-DD', () => {
  // полдень локального времени — дата не зависит от часового пояса
  const d = new Date(2026, 6, 3, 12, 0, 0);
  expect(localDayString(d.getTime())).toBe('2026-07-03');
});

test('questEvent двигает прогресс активного квеста', () => {
  useProgressStore.getState().questEvent('mouse-caught');
  const s = useProgressStore.getState();
  expect(s.activeQuests[0]).toEqual({ questId: 'catch-mice', stage: 0, progress: 1 });
  expect(s.stars).toBe(0);
  expect(s.celebration).toBeNull();
});

test('завершение квеста даёт звёзды, запись в лог и celebration', () => {
  jest.spyOn(clock, 'now').mockReturnValue(1_000);
  const { questEvent } = useProgressStore.getState();
  for (let i = 0; i < 5; i++) questEvent('ball-tapped');
  const s = useProgressStore.getState();
  expect(s.stars).toBe(1);
  expect(s.completedLog).toEqual([{ questId: 'play-ball', stars: 1, at: 1_000 }]);
  expect(s.celebration?.id).toBe('play-ball');
  // play-ball перевыдан на scratch-post
  expect(s.activeQuests.map((q) => q.questId)).toContain('scratch-post');
  s.clearCelebration();
  expect(useProgressStore.getState().celebration).toBeNull();
});

test('recordPlayDay добавляет день один раз', () => {
  const noon = new Date(2026, 6, 3, 12, 0, 0).getTime();
  const { recordPlayDay } = useProgressStore.getState();
  recordPlayDay(noon);
  recordPlayDay(noon + 60_000);
  expect(useProgressStore.getState().playDays).toEqual(['2026-07-03']);
});

test('resetProgress возвращает начальное состояние', () => {
  const { questEvent, resetProgress } = useProgressStore.getState();
  for (let i = 0; i < 5; i++) questEvent('ball-tapped');
  resetProgress();
  const s = useProgressStore.getState();
  expect(s.stars).toBe(0);
  expect(s.playDays).toEqual([]);
  expect(s.activeQuests).toEqual(initialActiveQuests());
  expect(s.completedLog).toEqual([]);
});

test('celebration не попадает в persist', () => {
  const partialize = useProgressStore.persist.getOptions().partialize!;
  const persisted = partialize(useProgressStore.getState());
  expect(persisted).not.toHaveProperty('celebration');
  expect(persisted).toHaveProperty('stars');
  expect(persisted).toHaveProperty('activeQuests');
});
