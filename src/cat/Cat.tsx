import { useEffect, useState } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { COATS, shadeColor, type CoatId } from './coats';

export type CatPose = 'idle' | 'happy' | 'sad' | 'eating' | 'sleeping';

export interface CatProps {
  coatId: CoatId;
  collarColor?: string | null;
  pose?: CatPose;
  size?: number;
  animated?: boolean; // моргание при открытых глазах
  testID?: string;
}

const BLINK_MIN_DELAY_MS = 3_000;
const BLINK_MAX_DELAY_MS = 6_000;
const BLINK_DURATION_MS = 150;

export function Cat({
  coatId,
  collarColor = null,
  pose = 'idle',
  size = 160,
  animated = false,
  testID,
}: CatProps) {
  const c = COATS[coatId];
  const [blinking, setBlinking] = useState(false);
  const poseEyesClosed = pose === 'sleeping' || pose === 'eating' || pose === 'happy';

  useEffect(() => {
    if (!animated || poseEyesClosed) {
      setBlinking(false);
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = BLINK_MIN_DELAY_MS + Math.random() * (BLINK_MAX_DELAY_MS - BLINK_MIN_DELAY_MS);
      timer = setTimeout(() => {
        setBlinking(true);
        timer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, BLINK_DURATION_MS);
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [animated, poseEyesClosed]);

  const eyesClosed = poseEyesClosed || blinking;
  // id градиента уникален на окрас — котята разных окрасов живут на одном экране (галерея, карусель)
  const gradId = `cat-body-${coatId}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" testID={testID ?? `cat-${pose}`}>
      <Defs>
        <RadialGradient id={gradId} cx="50%" cy="32%" r="80%">
          <Stop offset="0%" stopColor={shadeColor(c.body, 1.1)} />
          <Stop offset="100%" stopColor={shadeColor(c.body, 0.88)} />
        </RadialGradient>
      </Defs>
      {/* тень на полу */}
      <Ellipse cx={100} cy={188} rx={56} ry={8} fill="#5C4A32" opacity={0.12} />
      {/* хвост: во сне свёрнут, обычно трубой */}
      <Path
        d={pose === 'sleeping' ? 'M140 165 Q180 165 172 135' : 'M142 150 Q182 140 172 95'}
        stroke={c.mask ?? shadeColor(c.body, 0.95)}
        strokeWidth={14}
        strokeLinecap="round"
        fill="none"
      />
      {/* туловище: пропорции малыша — компактное, голова крупная */}
      <Ellipse cx={100} cy={148} rx={50} ry={38} fill={`url(#${gradId})`} />
      <Ellipse cx={100} cy={156} rx={28} ry={24} fill={c.belly} />
      {c.stripes && (
        <G stroke={c.stripes} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.85}>
          <Path d="M62 132 Q58 140 60 148" />
          <Path d="M138 132 Q142 140 140 148" />
        </G>
      )}
      {/* передние лапки */}
      <Ellipse cx={82} cy={182} rx={12} ry={8} fill={shadeColor(c.body, 1.04)} />
      <Ellipse cx={118} cy={182} rx={12} ry={8} fill={shadeColor(c.body, 1.04)} />
      {/* ошейник с бубенчиком */}
      {collarColor && (
        <>
          <Path d="M74 116 Q100 132 126 116 L126 126 Q100 142 74 126 Z" fill={collarColor} />
          <Circle cx={100} cy={134} r={5} fill="#F5D76E" />
          <Circle cx={100} cy={134} r={5} fill="none" stroke="#C9A227" strokeWidth={1.2} />
        </>
      )}
      {/* голова */}
      <Circle cx={100} cy={76} r={46} fill={`url(#${gradId})`} />
      {/* уши (у сиамца — тёмные), внутреннее ухо скруглено */}
      <Path d="M62 56 Q60 24 68 16 Q80 22 92 40 Z" fill={c.mask ?? c.body} />
      <Path d="M138 56 Q140 24 132 16 Q120 22 108 40 Z" fill={c.mask ?? c.body} />
      <Path d="M68 48 Q68 30 72 27 Q79 32 86 42 Z" fill={c.earInner} />
      <Path d="M132 48 Q132 30 128 27 Q121 32 114 42 Z" fill={c.earInner} />
      {/* сиамская маска */}
      {c.mask && <Ellipse cx={100} cy={92} rx={24} ry={16} fill={c.mask} opacity={0.55} />}
      {/* щёчки */}
      <Ellipse cx={100} cy={94} rx={20} ry={13} fill={c.belly} />
      {/* румянец */}
      <Ellipse cx={70} cy={91} rx={7} ry={4} fill="#F2A0A0" opacity={0.45} />
      <Ellipse cx={130} cy={91} rx={7} ry={4} fill="#F2A0A0" opacity={0.45} />
      {/* глаза */}
      {eyesClosed ? (
        <G stroke="#33322E" strokeWidth={3.5} strokeLinecap="round" fill="none">
          <Path d={pose === 'happy' ? 'M74 74 Q82 66 90 74' : 'M74 72 Q82 78 90 72'} />
          <Path d={pose === 'happy' ? 'M110 74 Q118 66 126 74' : 'M110 72 Q118 78 126 72'} />
        </G>
      ) : (
        <>
          <G fill="#33322E">
            <Circle cx={82} cy={72} r={7.5} />
            <Circle cx={118} cy={72} r={7.5} />
          </G>
          <G fill="#FFFFFF">
            <Circle cx={84.5} cy={69} r={2.6} />
            <Circle cx={120.5} cy={69} r={2.6} />
            <Circle cx={79.5} cy={75} r={1.2} opacity={0.8} />
            <Circle cx={115.5} cy={75} r={1.2} opacity={0.8} />
          </G>
        </>
      )}
      {/* грустные бровки */}
      {pose === 'sad' && (
        <G stroke="#33322E" strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M72 58 L90 64" />
          <Path d="M128 58 L110 64" />
        </G>
      )}
      {/* нос и рот */}
      <Path d="M96 88 L104 88 L100 94 Z" fill={c.nose} />
      {pose === 'sad' ? (
        <Path
          d="M92 104 Q100 98 108 104"
          stroke="#33322E"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      ) : pose === 'eating' ? (
        <Ellipse cx={100} cy={102} rx={6} ry={5} fill="#8C4A4A" />
      ) : (
        <Path
          d="M92 98 Q96 104 100 98 Q104 104 108 98"
          stroke="#33322E"
          strokeWidth={3}
          strokeLinecap="round"
          fill="none"
        />
      )}
      {/* усы: мягкие дуги */}
      <G stroke="#4A4740" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity={0.8}>
        <Path d="M60 86 Q72 87 82 90" />
        <Path d="M60 98 Q72 97 82 95" />
        <Path d="M140 86 Q128 87 118 90" />
        <Path d="M140 98 Q128 97 118 95" />
      </G>
      {/* маркер моргания для тестов */}
      {blinking && <G testID="cat-blink" />}
      {/* сон: z-z-z */}
      {pose === 'sleeping' && (
        <G stroke="#7A8BB5" strokeWidth={3} strokeLinecap="round" fill="none">
          <Path d="M146 40 L158 40 L146 52 L158 52" />
          <Path d="M162 22 L172 22 L162 32 L172 32" />
        </G>
      )}
    </Svg>
  );
}
