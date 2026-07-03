import { fireEvent, render, screen } from '@testing-library/react-native';

import { CatchTapLayer } from '../CatchTapLayer';

// Fake timers: петля движения целей (withTiming → hop) не должна крутиться на реальных таймерах
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('рендерит не больше трёх целей одновременно', async () => {
  await render(<CatchTapLayer kind="mouse" remaining={5} onCatch={jest.fn()} />);
  expect(screen.getByTestId('target-mouse-0')).toBeTruthy();
  expect(screen.getByTestId('target-mouse-1')).toBeTruthy();
  expect(screen.getByTestId('target-mouse-2')).toBeTruthy();
  expect(screen.queryByTestId('target-mouse-3')).toBeNull();
});

test('рендерит remaining целей, когда их меньше трёх', async () => {
  await render(<CatchTapLayer kind="butterfly" remaining={1} onCatch={jest.fn()} />);
  expect(screen.getByTestId('target-butterfly-0')).toBeTruthy();
  expect(screen.queryByTestId('target-butterfly-1')).toBeNull();
});

test('тап по цели вызывает onCatch', async () => {
  const onCatch = jest.fn();
  await render(<CatchTapLayer kind="mouse" remaining={3} onCatch={onCatch} />);
  await fireEvent.press(screen.getByTestId('target-mouse-0'));
  expect(onCatch).toHaveBeenCalledTimes(1);
});

test('при remaining=0 слой пуст', async () => {
  await render(<CatchTapLayer kind="mouse" remaining={0} onCatch={jest.fn()} />);
  expect(screen.queryByTestId('target-mouse-0')).toBeNull();
});
