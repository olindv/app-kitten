import { render, screen } from '@testing-library/react-native';

import { App } from '../App';

test('renders coat gallery placeholder', async () => {
  await render(<App />);
  expect(screen.getByTestId('gallery-ginger')).toBeTruthy();
});
