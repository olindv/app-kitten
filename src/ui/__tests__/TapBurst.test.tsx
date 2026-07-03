import { render, screen } from '@testing-library/react-native';

import { TapBurst } from '../TapBurst';

test('до первого срабатывания не рендерится', async () => {
  await render(<TapBurst emoji="🧶" trigger={0} testID="burst" />);
  expect(screen.queryByTestId('burst')).toBeNull();
});

test('после срабатывания показывает эмодзи', async () => {
  await render(<TapBurst emoji="🧶" trigger={1} testID="burst" />);
  expect(screen.getByTestId('burst')).toHaveTextContent('🧶');
});
