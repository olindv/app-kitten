import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

export const TARGET_SPRITE_SIZE = 44;
const WING_FLAP_MS = 220;

export function MouseSprite() {
  return (
    <Svg width={TARGET_SPRITE_SIZE} height={TARGET_SPRITE_SIZE} viewBox="0 0 100 100">
      {/* хвостик */}
      <Path d="M78 62 Q96 58 92 42" stroke="#8C8C99" strokeWidth={6} fill="none" />
      {/* тельце */}
      <Ellipse cx={48} cy={62} rx={34} ry={24} fill="#A6A6B3" />
      {/* ушки */}
      <Circle cx={26} cy={38} r={11} fill="#A6A6B3" />
      <Circle cx={26} cy={38} r={6} fill="#E8B4C8" />
      {/* глаз и нос */}
      <Circle cx={22} cy={58} r={3.5} fill="#33322E" />
      <Circle cx={13} cy={64} r={4} fill="#E8869E" />
    </Svg>
  );
}

// Крылья машут: пульс rx верхних крыльев (Reanimated, UI-поток)
export function ButterflySprite() {
  const flap = useSharedValue(0);
  useEffect(() => {
    flap.value = withRepeat(
      withTiming(1, { duration: WING_FLAP_MS, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [flap]);
  const wing = useAnimatedProps(() => ({ rx: 20 - flap.value * 9 }));
  return (
    <Svg width={TARGET_SPRITE_SIZE} height={TARGET_SPRITE_SIZE} viewBox="0 0 100 100">
      <AnimatedEllipse animatedProps={wing} cx={32} cy={42} ry={26} fill="#E8869E" />
      <AnimatedEllipse animatedProps={wing} cx={68} cy={42} ry={26} fill="#F0A34E" />
      <Ellipse cx={35} cy={70} rx={13} ry={16} fill="#E8B4C8" />
      <Ellipse cx={65} cy={70} rx={13} ry={16} fill="#F5C98A" />
      {/* тельце и усики */}
      <Ellipse cx={50} cy={55} rx={7} ry={26} fill="#5C4A32" />
      <Path
        d="M46 30 Q40 18 32 16 M54 30 Q60 18 68 16"
        stroke="#5C4A32"
        strokeWidth={3}
        fill="none"
      />
    </Svg>
  );
}
