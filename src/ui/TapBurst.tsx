import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

const BURST_MS = 600;

// Всплывающий эмодзи-отклик на тап: вверх, с масштабом, тает.
// trigger — счётчик срабатываний; каждый инкремент перезапускает анимацию.
export function TapBurst({
  emoji,
  trigger,
  testID,
}: {
  emoji: string;
  trigger: number;
  testID?: string;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (trigger === 0) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: BURST_MS, useNativeDriver: true }).start();
  }, [trigger, anim]);

  if (trigger === 0) return null;

  return (
    <Animated.Text
      testID={testID}
      style={[
        styles.burst,
        {
          opacity: anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -44] }) },
            {
              scale: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 1.25, 1] }),
            },
          ],
        },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  burst: { position: 'absolute', alignSelf: 'center', top: -6, fontSize: 26, zIndex: 2 },
});
