import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Line, Rect } from 'react-native-svg';

// Центры интерактивных зон, проценты = координаты viewBox (0 0 100 100).
// Когтеточка, клубок и коробка нарисованы, но станут интерактивными в фазе 2 (квесты).
export const HOME_SPOTS = [
  { id: 'bowl', left: '30%', top: '85%' },
  { id: 'bed', left: '84%', top: '87%' },
  { id: 'owner', left: '78%', top: '42%' },
] as const;

export type HomeSpotId = (typeof HOME_SPOTS)[number]['id'];

// Гостиная с кухонным уголком (спека §3). Держать < 60 SVG-узлов (спека §11).
export function HomeBackground() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      testID="home-background"
    >
      {/* стена и пол */}
      <Rect x={0} y={0} width={100} height={62} fill="#F6E7C9" />
      <Rect x={0} y={62} width={100} height={38} fill="#E3B584" />
      {/* окно */}
      <Rect
        x={8}
        y={8}
        width={22}
        height={18}
        rx={1.5}
        fill="#B5E0F5"
        stroke="#8A6B4A"
        strokeWidth={1.2}
      />
      <Line x1={19} y1={8} x2={19} y2={26} stroke="#8A6B4A" strokeWidth={0.8} />
      <Line x1={8} y1={17} x2={30} y2={17} stroke="#8A6B4A" strokeWidth={0.8} />
      {/* кухонный уголок: плита */}
      <Rect x={36} y={40} width={16} height={22} fill="#C2C7CE" />
      <Rect x={38} y={43} width={12} height={7} rx={1} fill="#4E555E" />
      <Circle cx={41} cy={41.5} r={1.4} fill="#4E555E" />
      <Circle cx={47} cy={41.5} r={1.4} fill="#4E555E" />
      {/* диван */}
      <Rect x={60} y={30} width={36} height={12} rx={4} fill="#B95F4E" />
      <Rect x={60} y={38} width={36} height={20} rx={4} fill="#C96F5E" />
      {/* хозяйка */}
      <Circle cx={70} cy={34} r={5} fill="#F2C9A3" />
      <Rect x={65} y={39} width={10} height={14} rx={3} fill="#7BA05B" />
      {/* хозяин */}
      <Circle cx={86} cy={34} r={5} fill="#E8B48C" />
      <Rect x={81} y={39} width={10} height={14} rx={3} fill="#5B7BA0" />
      {/* ковёр */}
      <Ellipse cx={50} cy={82} rx={24} ry={8} fill="#D98577" opacity={0.8} />
      {/* когтеточка */}
      <Ellipse cx={7.5} cy={80} rx={5} ry={2} fill="#8A6B4A" />
      <Rect x={6} y={62} width={3} height={18} fill="#B98E63" />
      <Ellipse cx={7.5} cy={62} rx={5} ry={2} fill="#8A6B4A" />
      {/* коробка */}
      <Rect x={66} y={66} width={12} height={9} fill="#C9A063" stroke="#A9834C" strokeWidth={0.8} />
      {/* клубок */}
      <Circle cx={55} cy={91} r={3.2} fill="#E05A7A" />
      {/* миска */}
      <Ellipse cx={30} cy={85} rx={5} ry={2.2} fill="#4E7FB5" />
      <Ellipse cx={30} cy={84.2} rx={3.4} ry={1.3} fill="#7FA8D1" />
      {/* лежанка */}
      <Ellipse cx={84} cy={87} rx={9} ry={3.6} fill="#A67B9E" />
      <Ellipse cx={84} cy={86.2} rx={6.5} ry={2.4} fill="#C89EC0" />
    </Svg>
  );
}
