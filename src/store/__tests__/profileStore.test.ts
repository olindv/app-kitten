import AsyncStorage from '@react-native-async-storage/async-storage';

import { useProfileStore } from '../profileStore';

const flushPersist = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfileStore.setState({ profile: null });
});

test('createProfile кладёт профиль в стор и в AsyncStorage', async () => {
  useProfileStore.getState().createProfile({ name: 'Мурзик', coatId: 'ginger', collarColor: null });
  await flushPersist();

  expect(useProfileStore.getState().profile?.name).toBe('Мурзик');
  const raw = await AsyncStorage.getItem('kitten/profile');
  expect(JSON.parse(raw!).state.profile).toEqual({
    name: 'Мурзик',
    coatId: 'ginger',
    collarColor: null,
  });
});

test('rehydrate восстанавливает профиль из AsyncStorage', async () => {
  await AsyncStorage.setItem(
    'kitten/profile',
    JSON.stringify({
      state: { profile: { name: 'Буся', coatId: 'white', collarColor: '#E4572E' } },
      version: 0,
    }),
  );
  await useProfileStore.persist.rehydrate();
  expect(useProfileStore.getState().profile?.name).toBe('Буся');
});

test('resetProfile очищает профиль', async () => {
  useProfileStore.getState().createProfile({ name: 'Кузя', coatId: 'gray', collarColor: null });
  useProfileStore.getState().resetProfile();
  expect(useProfileStore.getState().profile).toBeNull();
});
