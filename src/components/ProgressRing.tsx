import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  /** How much of the ring is drawn, from 0 to 1. Clamped. */
  progress: number;
  size: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  /** Draws the arc faintly, e.g. while paused. */
  faded?: boolean;
  /** Shown centred inside the ring, e.g. the time left. */
  children?: ReactNode;
};

/**
 * A circular progress indicator: the arc starts at 12 o'clock and runs clockwise for
 * `progress` of the circle. Presentation only; the caller decides what progress means.
 */
export function ProgressRing({
  progress,
  size,
  strokeWidth = 10,
  color,
  trackColor,
  faded = false,
  children,
}: Props) {
  const clamped = Math.min(1, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centre = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      {/* Decorative: the time inside says the same thing to screen readers. */}
      <View aria-hidden>
        <Svg width={size} height={size}>
          <Circle
            cx={centre}
            cy={centre}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* A round cap would leave a dot at zero, so an empty ring draws no arc at all. */}
          {clamped > 0 ? (
            <Circle
              cx={centre}
              cy={centre}
              r={radius}
              stroke={color}
              strokeOpacity={faded ? 0.45 : 1}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - clamped)}
              transform={`rotate(-90 ${centre} ${centre})`}
            />
          ) : null}
        </Svg>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
