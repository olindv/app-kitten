import { render, screen } from '@testing-library/react-native';

import { HOME_SPOTS, HomeBackground } from '../HomeScene';

test('фон дома рендерится', async () => {
  await render(<HomeBackground />);
  expect(screen.getByTestId('home-background')).toBeTruthy();
});

test('интерактивные точки: миска, лежанка, хозяин + клубок и когтеточка (фаза 2)', () => {
  expect(HOME_SPOTS.map((s) => s.id)).toEqual(['bowl', 'bed', 'owner', 'ball', 'scratcher']);
});
