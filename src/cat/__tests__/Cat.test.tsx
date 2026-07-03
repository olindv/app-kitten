import { act, render, screen } from '@testing-library/react-native';

import { Cat, type CatPose } from '../Cat';
import { COAT_IDS } from '../coats';

test.each(COAT_IDS)('рендерится с окрасом %s', async (coatId) => {
  await render(<Cat coatId={coatId} />);
  expect(screen.getByTestId('cat-idle')).toBeTruthy();
});

const POSES: CatPose[] = ['idle', 'happy', 'sad', 'eating', 'sleeping'];

test.each(POSES)('рендерится в позе %s', async (pose) => {
  await render(<Cat coatId="ginger" pose={pose} />);
  expect(screen.getByTestId(`cat-${pose}`)).toBeTruthy();
});

test('рендерится с ошейником и кастомным testID', async () => {
  await render(<Cat coatId="tabby" collarColor="#E4572E" testID="preview-tabby" />);
  expect(screen.getByTestId('preview-tabby')).toBeTruthy();
});

test('animated: котёнок моргает по таймеру', async () => {
  jest.useFakeTimers();
  jest.spyOn(Math, 'random').mockReturnValue(0); // детерминированная задержка = 3000 мс
  await render(<Cat coatId="ginger" animated />);
  expect(screen.getByTestId('cat-idle')).toBeTruthy();
  expect(screen.queryByTestId('cat-blink')).toBeNull();
  await act(async () => jest.advanceTimersByTime(3_000)); // момент начала моргания
  expect(screen.getByTestId('cat-blink')).toBeTruthy();
  await act(async () => jest.advanceTimersByTime(200)); // моргнул — глаза снова открыты
  expect(screen.queryByTestId('cat-blink')).toBeNull();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('без animated моргание не запускается', async () => {
  jest.useFakeTimers();
  await render(<Cat coatId="ginger" />);
  await act(async () => jest.advanceTimersByTime(10_000));
  expect(screen.queryByTestId('cat-blink')).toBeNull();
  jest.useRealTimers();
});
