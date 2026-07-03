import { render, screen } from '@testing-library/react-native';

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
