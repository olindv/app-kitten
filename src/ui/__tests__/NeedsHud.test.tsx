import { render, screen } from '@testing-library/react-native';

import { useNeedsStore } from '../../store/needsStore';
import { NeedsHud } from '../NeedsHud';

test('полоски отражают значения потребностей', async () => {
  useNeedsStore.setState({ needs: { hunger: 40, energy: 70, mood: 100, updatedAt: 0 } });
  await render(<NeedsHud />);
  expect(screen.getByTestId('hud-hunger-fill')).toHaveStyle({ width: '40%' });
  expect(screen.getByTestId('hud-energy-fill')).toHaveStyle({ width: '70%' });
  expect(screen.getByTestId('hud-mood-fill')).toHaveStyle({ width: '100%' });
});

test('дробные значения округляются', async () => {
  useNeedsStore.setState({ needs: { hunger: 98.4, energy: 100, mood: 99.6, updatedAt: 0 } });
  await render(<NeedsHud />);
  expect(screen.getByTestId('hud-hunger-fill')).toHaveStyle({ width: '98%' });
  expect(screen.getByTestId('hud-mood-fill')).toHaveStyle({ width: '100%' });
});
