import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';

import { useProfileStore } from '../../store/profileStore';
import { App } from '../App';

beforeEach(async () => {
  await AsyncStorage.clear();
  useProfileStore.setState({ profile: null });
});

test('без профиля показывает экран создания', async () => {
  await render(<App />);
  await waitFor(() => expect(screen.getByText('Твой котёнок')).toBeTruthy());
});

test('с профилем показывает игровую сцену', async () => {
  useProfileStore.setState({
    profile: { name: 'Мурзик', coatId: 'ginger', collarColor: null },
  });
  await render(<App />);
  await waitFor(() => expect(screen.getByTestId('game-screen')).toBeTruthy());
});
