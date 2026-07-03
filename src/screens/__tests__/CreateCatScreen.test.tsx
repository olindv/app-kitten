import { fireEvent, render, screen } from '@testing-library/react-native';

import { clock } from '../../app/clock';
import { KITTEN_NAMES } from '../../cat/names';
import { useNeedsStore } from '../../store/needsStore';
import { useProfileStore } from '../../store/profileStore';
import { CreateCatScreen } from '../CreateCatScreen';

beforeEach(() => {
  useProfileStore.setState({ profile: null });
  jest.restoreAllMocks();
});

test('стрелки листают окрасы по кругу', async () => {
  await render(<CreateCatScreen />);
  expect(screen.getByTestId('preview-ginger')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('coat-next'));
  expect(screen.getByTestId('preview-gray')).toBeTruthy();
  await fireEvent.press(screen.getByTestId('coat-prev'));
  await fireEvent.press(screen.getByTestId('coat-prev'));
  expect(screen.getByTestId('preview-siamese')).toBeTruthy();
});

test('кнопка 🎲 подставляет имя из пула', async () => {
  await render(<CreateCatScreen />);
  await fireEvent.press(screen.getByTestId('random-name'));
  expect(KITTEN_NAMES).toContain(screen.getByTestId('name-input').props.value);
});

test('«Начать» создаёт профиль и сбрасывает потребности на clock.now()', async () => {
  jest.spyOn(clock, 'now').mockReturnValue(123_456);
  await render(<CreateCatScreen />);
  await fireEvent.changeText(screen.getByTestId('name-input'), 'Барсик');
  await fireEvent.press(screen.getByTestId('coat-next'));
  await fireEvent.press(screen.getByTestId('collar-#E4572E'));
  await fireEvent.press(screen.getByTestId('start-button'));

  expect(useProfileStore.getState().profile).toEqual({
    name: 'Барсик',
    coatId: 'gray',
    collarColor: '#E4572E',
  });
  expect(useNeedsStore.getState().needs).toEqual({
    hunger: 100,
    energy: 100,
    mood: 100,
    updatedAt: 123_456,
  });
});

test('пустое имя заменяется случайным из пула', async () => {
  await render(<CreateCatScreen />);
  await fireEvent.press(screen.getByTestId('start-button'));
  expect(KITTEN_NAMES).toContain(useProfileStore.getState().profile?.name);
});
