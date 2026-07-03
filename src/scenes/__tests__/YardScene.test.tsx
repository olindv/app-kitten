import { render, screen } from '@testing-library/react-native';

import { YARD_SPOTS, YardBackground } from '../YardScene';

test('фон двора рендерится', async () => {
  await render(<YardBackground />);
  expect(screen.getByTestId('yard-background')).toBeTruthy();
});

test('хотспот хозяина на крыльце определён', () => {
  expect(YARD_SPOTS.map((s) => s.id)).toEqual(['yard-owner']);
});
