import { render, screen } from '@testing-library/react-native';

import { App } from '../App';

test('renders home placeholder', async () => {
  await render(<App />);
  expect(screen.getByText('🐱 Мой Котёнок')).toBeTruthy();
});
