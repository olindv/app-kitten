import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

// Центры интерактивных зон в процентах экрана (архитектура как HOME_SPOTS).
// Хозяин стоит на крыльце — сюда ребёнок «приносит» пойманных мышек (квест 1).
export const YARD_SPOTS = [{ id: 'yard-owner', left: '82%', top: '52%' }] as const;

export type YardSpotId = (typeof YARD_SPOTS)[number]['id'];

const CLOUD_DRIFT_MS = 9_000;

function Sprite({
  style,
  viewBox,
  children,
}: {
  style: ViewStyle;
  viewBox: string;
  children: ReactNode;
}) {
  return (
    <View style={[styles.sprite, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMax meet">
        {children}
      </Svg>
    </View>
  );
}

// Сад у загородного дома (спека §3). Держать < 60 SVG-узлов суммарно (спека §11).
export function YardBackground() {
  const cloudX = useRef(new Animated.Value(0)).current;

  // «ВАУ»-слой: облако медленно дрейфует туда-обратно
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cloudX, {
          toValue: 1,
          duration: CLOUD_DRIFT_MS,
          useNativeDriver: true,
        }),
        Animated.timing(cloudX, {
          toValue: 0,
          duration: CLOUD_DRIFT_MS,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cloudX]);

  const cloudShift = cloudX.interpolate({ inputRange: [0, 1], outputRange: [-14, 14] });

  return (
    <View style={StyleSheet.absoluteFill} testID="yard-background" pointerEvents="none">
      {/* небо и трава */}
      <View style={styles.sky} />
      <View style={styles.grass} />
      {/* солнце — правее HUD потребностей, левее облака */}
      <Sprite
        style={{ left: '33%', top: '4%', width: '16%', aspectRatio: 1 }}
        viewBox="0 0 100 100"
      >
        <Circle cx={50} cy={50} r={26} fill="#F5D76E" />
        <Circle cx={50} cy={50} r={34} fill="#F5D76E" opacity={0.35} />
      </Sprite>
      {/* дрейфующее облако */}
      <Animated.View
        style={[styles.cloud, { transform: [{ translateX: cloudShift }] }]}
        pointerEvents="none"
      >
        <Svg width="100%" height="100%" viewBox="0 0 160 70">
          <Ellipse cx={55} cy={45} rx={45} ry={20} fill="#FFFFFF" opacity={0.95} />
          <Ellipse cx={95} cy={35} rx={38} ry={22} fill="#FFFFFF" opacity={0.9} />
          <Ellipse cx={125} cy={48} rx={30} ry={15} fill="#FFFFFF" opacity={0.95} />
        </Svg>
      </Animated.View>
      {/* забор вдоль линии травы */}
      <Sprite
        style={{ left: '0%', top: '44%', width: '100%', aspectRatio: 6.5 }}
        viewBox="0 0 390 60"
      >
        <Line x1={0} y1={22} x2={390} y2={22} stroke="#C9A063" strokeWidth={7} />
        <Line x1={0} y1={42} x2={390} y2={42} stroke="#C9A063" strokeWidth={7} />
        {[15, 65, 115, 165, 215, 265, 315, 365].map((x) => (
          <Rect key={x} x={x} y={4} width={12} height={54} rx={4} fill="#B98E53" />
        ))}
      </Sprite>
      {/* дерево слева */}
      <Sprite
        style={{ left: '1%', bottom: '34%', width: '30%', aspectRatio: 0.85 }}
        viewBox="0 0 85 100"
      >
        <Rect x={36} y={55} width={14} height={45} rx={5} fill="#8A6B4A" />
        <Circle cx={42} cy={34} r={30} fill="#6FA85C" />
        <Circle cx={20} cy={48} r={18} fill="#7DB56A" />
        <Circle cx={65} cy={46} r={19} fill="#63994F" />
      </Sprite>
      {/* крыльцо с хозяином справа */}
      <Sprite
        style={{ left: '66%', bottom: '38%', width: '32%', aspectRatio: 1.1 }}
        viewBox="0 0 110 100"
      >
        {/* навес и столбики */}
        <Path d="M2 26 L55 4 L108 26 Z" fill="#B95F4E" />
        <Rect x={8} y={26} width={8} height={56} fill="#8A6B4A" />
        <Rect x={94} y={26} width={8} height={56} fill="#8A6B4A" />
        {/* площадка и ступенька */}
        <Rect x={2} y={78} width={106} height={12} rx={3} fill="#A9834C" />
        <Rect x={14} y={90} width={82} height={9} rx={3} fill="#8A6B4A" />
        {/* хозяин стоит на крыльце */}
        <Circle cx={55} cy={42} r={12} fill="#E8B48C" />
        <Path d="M43 39 Q55 25 67 39 L67 42 L43 42 Z" fill="#5A4632" />
        <Rect x={43} y={53} width={24} height={27} rx={8} fill="#5B7BA0" />
      </Sprite>
      {/* цветы на траве */}
      <Sprite
        style={{ left: '12%', bottom: '10%', width: '9%', aspectRatio: 0.8 }}
        viewBox="0 0 40 50"
      >
        <Line x1={20} y1={24} x2={20} y2={48} stroke="#4E8A3C" strokeWidth={4} />
        <Circle cx={20} cy={16} r={12} fill="#E05A7A" />
        <Circle cx={20} cy={16} r={5} fill="#F5D76E" />
      </Sprite>
      <Sprite
        style={{ left: '38%', bottom: '6%', width: '8%', aspectRatio: 0.8 }}
        viewBox="0 0 40 50"
      >
        <Line x1={20} y1={24} x2={20} y2={48} stroke="#4E8A3C" strokeWidth={4} />
        <Circle cx={20} cy={16} r={11} fill="#7A8BE0" />
        <Circle cx={20} cy={16} r={5} fill="#F5D76E" />
      </Sprite>
      <Sprite
        style={{ left: '55%', bottom: '12%', width: '7%', aspectRatio: 0.8 }}
        viewBox="0 0 40 50"
      >
        <Line x1={20} y1={24} x2={20} y2={48} stroke="#4E8A3C" strokeWidth={4} />
        <Circle cx={20} cy={16} r={10} fill="#F0A34E" />
        <Circle cx={20} cy={16} r={4} fill="#FFF3D6" />
      </Sprite>
    </View>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute' },
  sky: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '52%',
    backgroundColor: '#BDE3F2',
  },
  grass: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '52%',
    bottom: 0,
    backgroundColor: '#8FBF6B',
  },
  cloud: { position: 'absolute', left: '52%', top: '5%', width: '34%', aspectRatio: 2.3 },
});
