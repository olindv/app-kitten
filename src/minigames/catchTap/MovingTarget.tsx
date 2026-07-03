import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface Band {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// Цель блуждает по случайным путевым точкам внутри полосы.
// Вся петля движения — на UI-потоке (worklet), JS-поток не трогаем (спека §11).
export function MovingTarget({
  band,
  speed, // px/сек
  onPress,
  testID,
  children,
}: {
  band: Band;
  speed: number;
  onPress: () => void;
  testID: string;
  children: ReactNode;
}) {
  const x = useSharedValue(band.minX + Math.random() * (band.maxX - band.minX));
  const y = useSharedValue(band.minY + Math.random() * (band.maxY - band.minY));

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      const hop = () => {
        const nx = band.minX + Math.random() * (band.maxX - band.minX);
        const ny = band.minY + Math.random() * (band.maxY - band.minY);
        const dist = Math.hypot(nx - x.value, ny - y.value);
        const duration = Math.max(350, (dist / speed) * 1000);
        x.value = withTiming(nx, { duration, easing: Easing.inOut(Easing.quad) });
        y.value = withTiming(ny, { duration, easing: Easing.inOut(Easing.quad) }, (finished) => {
          if (finished) hop();
        });
      };
      hop();
    })();
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
    };
    // band/speed стабильны на время жизни цели
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  return (
    <Animated.View style={[styles.target, style]}>
      <Pressable testID={testID} onPress={onPress} style={styles.touch}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

// Касание ≥ 64dp (спека §1): спрайт 44px внутри зоны 64px
const styles = StyleSheet.create({
  target: { position: 'absolute', left: 0, top: 0 },
  touch: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
});
