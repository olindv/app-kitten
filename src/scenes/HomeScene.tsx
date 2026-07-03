import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

// Центры интерактивных зон в процентах экрана. Позиции согласованы со спрайтами ниже.
export const HOME_SPOTS = [
  { id: 'bowl', left: '28%', top: '87%' },
  { id: 'bed', left: '84%', top: '89%' },
  { id: 'owner', left: '78%', top: '48%' },
  { id: 'ball', left: '54%', top: '90%' },
  { id: 'scratcher', left: '9%', top: '75%' },
] as const;

export type HomeSpotId = (typeof HOME_SPOTS)[number]['id'];

// Мебель — отдельные SVG-спрайты с фиксированной пропорцией (aspectRatio),
// позиционируются процентами: не искажаются ни на телефоне, ни на планшете.
// Точная посадка хотспота на спрайт проверяется глазами на устройстве;
// допуск ±пара процентов покрывается зоной касания 64dp.
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

// Гостиная с кухонным уголком (спека §3). Держать < 60 SVG-узлов суммарно (спека §11).
export function HomeBackground() {
  return (
    <View style={StyleSheet.absoluteFill} testID="home-background" pointerEvents="none">
      {/* стена и пол */}
      <View style={styles.wall} />
      <View style={styles.floor} />
      {/* окно с солнышком */}
      <Sprite
        style={{ left: '34%', top: '12%', width: '30%', aspectRatio: 1.1 }}
        viewBox="0 0 110 100"
      >
        <Rect x={5} y={5} width={100} height={90} rx={6} fill="#8A6B4A" />
        <Rect x={12} y={12} width={86} height={76} fill="#B5E0F5" />
        <Circle cx={78} cy={32} r={10} fill="#F5D76E" />
        <Line x1={55} y1={12} x2={55} y2={88} stroke="#8A6B4A" strokeWidth={5} />
        <Line x1={12} y1={50} x2={98} y2={50} stroke="#8A6B4A" strokeWidth={5} />
      </Sprite>
      {/* кухонный уголок: плита */}
      <Sprite
        style={{ left: '32%', bottom: '42%', width: '18%', aspectRatio: 0.72 }}
        viewBox="0 0 72 100"
      >
        <Rect x={2} y={4} width={68} height={94} rx={4} fill="#C2C7CE" />
        <Circle cx={20} cy={13} r={6} fill="#4E555E" />
        <Circle cx={52} cy={13} r={6} fill="#4E555E" />
        <Rect x={10} y={30} width={52} height={40} rx={4} fill="#4E555E" />
        <Rect x={16} y={36} width={40} height={24} rx={3} fill="#7A838E" />
      </Sprite>
      {/* диван с хозяевами */}
      <Sprite
        style={{ left: '54%', bottom: '42%', width: '42%', aspectRatio: 1.35 }}
        viewBox="0 0 135 100"
      >
        <Rect x={5} y={30} width={125} height={45} rx={12} fill="#B95F4E" />
        {/* хозяйка */}
        <Circle cx={45} cy={26} r={14} fill="#F2C9A3" />
        <Path d="M31 24 Q45 2 59 24 Z" fill="#8A5A3B" />
        <Rect x={31} y={40} width={28} height={36} rx={9} fill="#7BA05B" />
        {/* хозяин */}
        <Circle cx={95} cy={26} r={14} fill="#E8B48C" />
        <Path d="M81 22 Q95 6 109 22 L109 25 L81 25 Z" fill="#5A4632" />
        <Rect x={81} y={40} width={28} height={36} rx={9} fill="#5B7BA0" />
        {/* сиденье поверх ног */}
        <Rect x={5} y={68} width={125} height={27} rx={10} fill="#C96F5E" />
      </Sprite>
      {/* ковёр */}
      <Sprite
        style={{ left: '18%', bottom: '4%', width: '64%', aspectRatio: 3.4 }}
        viewBox="0 0 340 100"
      >
        <Ellipse cx={170} cy={50} rx={165} ry={46} fill="#D98577" opacity={0.75} />
        <Ellipse cx={170} cy={50} rx={125} ry={34} fill="#E39B8E" opacity={0.6} />
      </Sprite>
      {/* когтеточка */}
      <Sprite
        style={{ left: '3%', bottom: '18%', width: '11%', aspectRatio: 0.5 }}
        viewBox="0 0 50 100"
      >
        <Ellipse cx={25} cy={91} rx={22} ry={8} fill="#8A6B4A" />
        <Rect x={19} y={10} width={12} height={82} fill="#B98E63" />
        <Ellipse cx={25} cy={10} rx={20} ry={7} fill="#A9834C" />
      </Sprite>
      {/* коробка */}
      <Sprite
        style={{ left: '78%', bottom: '30%', width: '15%', aspectRatio: 1.3 }}
        viewBox="0 0 130 100"
      >
        <Path d="M8 30 L30 8 L122 8 L100 30 Z" fill="#B98E53" />
        <Rect x={8} y={30} width={92} height={64} fill="#C9A063" stroke="#A9834C" strokeWidth={4} />
      </Sprite>
      {/* клубок */}
      <Sprite
        style={{ left: '50%', bottom: '4%', width: '8%', aspectRatio: 1 }}
        viewBox="0 0 100 100"
      >
        <Circle cx={50} cy={50} r={44} fill="#E05A7A" />
        <Path d="M14 40 Q50 60 86 36" stroke="#C23D5E" strokeWidth={7} fill="none" />
        <Path d="M20 66 Q54 82 84 58" stroke="#C23D5E" strokeWidth={7} fill="none" />
      </Sprite>
      {/* миска */}
      <Sprite
        style={{ left: '20%', bottom: '9%', width: '16%', aspectRatio: 2.2 }}
        viewBox="0 0 220 100"
      >
        <Ellipse cx={110} cy={58} rx={100} ry={40} fill="#4E7FB5" />
        <Ellipse cx={110} cy={48} rx={74} ry={26} fill="#7FA8D1" />
        <Ellipse cx={110} cy={50} rx={50} ry={16} fill="#F0E3C8" />
      </Sprite>
      {/* лежанка */}
      <Sprite
        style={{ left: '75%', bottom: '6%', width: '19%', aspectRatio: 2 }}
        viewBox="0 0 200 100"
      >
        <Ellipse cx={100} cy={55} rx={95} ry={42} fill="#A67B9E" />
        <Ellipse cx={100} cy={48} rx={70} ry={28} fill="#C89EC0" />
      </Sprite>
    </View>
  );
}

const styles = StyleSheet.create({
  sprite: { position: 'absolute' },
  wall: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '58%',
    backgroundColor: '#F6E7C9',
  },
  floor: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '58%',
    bottom: 0,
    backgroundColor: '#E3B584',
  },
});
