import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { MovingTarget, type Band } from './MovingTarget';
import { ButterflySprite, MouseSprite } from './sprites';

export type CatchKind = 'mouse' | 'butterfly';

const MAX_TARGETS = 3;
const TOUCH_SIZE = 64;
const SPEED: Record<CatchKind, number> = { mouse: 150, butterfly: 90 };

// Слой ловли живёт прямо в сцене двора (спека §6: мышки перебегают, тап = поймал).
// Мышки бегают по траве, бабочки порхают в верхней части.
export function CatchTapLayer({
  kind,
  remaining,
  onCatch,
}: {
  kind: CatchKind;
  remaining: number;
  onCatch: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const band: Band =
    kind === 'mouse'
      ? { minX: 0, maxX: width - TOUCH_SIZE, minY: height * 0.58, maxY: height * 0.82 }
      : { minX: 0, maxX: width - TOUCH_SIZE, minY: height * 0.16, maxY: height * 0.46 };
  const visible = Math.min(MAX_TARGETS, Math.max(0, remaining));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID={`catch-layer-${kind}`}>
      {Array.from({ length: visible }, (_, i) => (
        <MovingTarget
          key={`${kind}-${i}`}
          testID={`target-${kind}-${i}`}
          band={band}
          speed={SPEED[kind]}
          onPress={onCatch}
        >
          {kind === 'mouse' ? <MouseSprite /> : <ButterflySprite />}
        </MovingTarget>
      ))}
    </View>
  );
}
