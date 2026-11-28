import Ionicons from '@expo/vector-icons/Ionicons';
import { type ComponentRef, useEffect, useMemo, useRef, useState } from 'react';
import { type AccessibilityActionEvent, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { radius, spacing, textVariants, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

type Props = {
  /** Allowed values in order, e.g. 0–59. Bounded: the wheel stops at both ends. */
  values: number[];
  value: number;
  onChange: (value: number) => void;
  /** Short caption under the wheel, e.g. "min". */
  label: string;
  /** Spoken value, e.g. (5) => "5 minutes". */
  spoken: (value: number) => string;
  /** Visible text for a value; defaults to two digits ("05"). */
  format?: (value: number) => string;
  /** Height of one row; the wheel shows `visibleRows` of them. */
  rowHeight?: number;
  visibleRows?: 3 | 5;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** After scrolling stops for this long, the wheel settles on the nearest row. */
const SETTLE_MS = 120;

/**
 * An iOS-style scroll wheel for picking one value. It's pure presentation: values in,
 * `onChange` out, so countdowns, rest timers or rep counts can all use it.
 *
 * - Scrolling: momentum and snap-to-centre on phones (`snapToInterval`). On every platform,
 *   a short pause after the last scroll event settles on the nearest row and reports it,
 *   so fast flicks, web wheels and trackpads all land on a real value.
 * - Look: the centre row sits in a highlighted band; neighbours fade and shrink with the
 *   scroll position (driven natively on phones).
 * - Alternatives to scrolling: ↑/↓ buttons, arrow keys on web, and screen-reader
 *   increment/decrement (the wheel is an "adjustable" control).
 */
export function WheelPicker({
  values,
  value,
  onChange,
  label,
  spoken,
  format = pad2,
  rowHeight = 44,
  visibleRows = 5,
}: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const index = Math.max(0, values.indexOf(value));
  const padding = ((visibleRows - 1) / 2) * rowHeight;

  // Created once; drives the fade and scale of every row.
  const [scrollY] = useState(() => new Animated.Value(index * rowHeight));
  // The row the wheel is showing (or scrolling to), so outside changes only scroll when needed.
  const shownIndex = useRef(index);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const latest = useRef({ values, onChange });
  useEffect(() => {
    latest.current = { values, onChange };
  });

  // A new value from outside (preset, arrow, keyboard, screen reader): move the wheel to it.
  useEffect(() => {
    if (index === shownIndex.current) return;
    shownIndex.current = index;
    scrollRef.current?.scrollTo({ y: index * rowHeight, animated: true });
  }, [index, rowHeight]);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  // Drives the row fade and scale (natively on phones).
  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: Platform.OS !== 'web',
      }),
    [scrollY],
  );

  // Once scrolling stops, snap exactly onto the nearest row (web has no native snapping)
  // and report its value. Fast flicks report only where they finally land.
  useEffect(() => {
    const settle = (y: number) => {
      const { values: vs, onChange: report } = latest.current;
      const i = Math.min(vs.length - 1, Math.max(0, Math.round(y / rowHeight)));
      shownIndex.current = i;
      if (Math.abs(y - i * rowHeight) > 0.5)
        scrollRef.current?.scrollTo({ y: i * rowHeight, animated: true });
      if (vs[i] !== undefined) report(vs[i]);
    };
    const id = scrollY.addListener(({ value: y }) => {
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(() => settle(y), SETTLE_MS);
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, rowHeight]);

  const step = (delta: number) => {
    const next = values[Math.min(values.length - 1, Math.max(0, index + delta))];
    if (next !== undefined && next !== value) onChange(next);
  };

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') step(1);
    if (event.nativeEvent.actionName === 'decrement') step(-1);
  };

  // Web: arrow keys adjust a focused wheel (and don't scroll the page).
  const webKeys: object =
    Platform.OS === 'web'
      ? {
          onKeyDown: (e: { key: string; preventDefault: () => void }) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              step(e.key === 'ArrowUp' ? 1 : -1);
            }
          },
        }
      : {};

  const atMin = index === 0;
  const atMax = index === values.length - 1;
  const height = rowHeight * visibleRows;
  // Arrows and digits scale with the row, so a compact wheel stays in proportion.
  const arrowHeight = Math.round(Math.min(32, rowHeight * 0.75));
  const valueSize = { fontSize: Math.round(rowHeight * 0.6), lineHeight: Math.round(rowHeight * 0.72) };

  return (
    <View style={styles.column}>
      <Pressable
        onPress={() => step(1)}
        disabled={atMax}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        style={({ pressed }) => [
          styles.arrow,
          { height: arrowHeight },
          (pressed || atMax) && styles.arrowDim,
        ]}
      >
        <Ionicons name="chevron-up" size={22} color={colors.textMuted} />
      </Pressable>

      <View
        style={[styles.wheel, { height }]}
        accessible
        focusable
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        // aria-value* map to accessibilityValue on phones and to ARIA on web.
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        aria-valuenow={value}
        aria-valuetext={spoken(value)}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAccessibilityAction}
        {...webKeys}
      >
        <View
          pointerEvents="none"
          style={[styles.band, { top: padding, height: rowHeight }]}
          importantForAccessibility="no"
        />
        <Animated.ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={rowHeight}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          contentOffset={{ x: 0, y: index * rowHeight }}
          // Web ignores contentOffset, so position the wheel once it has a size.
          onLayout={() => scrollRef.current?.scrollTo({ y: shownIndex.current * rowHeight, animated: false })}
          contentContainerStyle={{ paddingVertical: padding }}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {values.map((v, i) => {
            const input = [-2, -1, 0, 1, 2].map((d) => (i + d) * rowHeight);
            const opacity = scrollY.interpolate({
              inputRange: input,
              outputRange: [0.2, 0.45, 1, 0.45, 0.2],
              extrapolate: 'clamp',
            });
            const scale = scrollY.interpolate({
              inputRange: input,
              outputRange: [0.8, 0.9, 1, 0.9, 0.8],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={v}
                style={[styles.row, { height: rowHeight, opacity, transform: [{ scale }] }]}
              >
                <Animated.Text style={[styles.value, valueSize]} maxFontSizeMultiplier={1.2}>
                  {format(v)}
                </Animated.Text>
              </Animated.View>
            );
          })}
        </Animated.ScrollView>
      </View>

      <Pressable
        onPress={() => step(-1)}
        disabled={atMin}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        style={({ pressed }) => [
          styles.arrow,
          { height: arrowHeight },
          (pressed || atMin) && styles.arrowDim,
        ]}
      >
        <Ionicons name="chevron-down" size={22} color={colors.textMuted} />
      </Pressable>

      <AppText variant="small" tone="muted" importantForAccessibility="no" style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    column: { flex: 1, alignItems: 'center', minWidth: 0 },
    arrow: { width: 44, alignItems: 'center', justifyContent: 'center' },
    arrowDim: { opacity: 0.35 },
    wheel: { alignSelf: 'stretch', overflow: 'hidden' },
    band: {
      position: 'absolute',
      left: 0,
      right: 0,
      borderRadius: radius.md,
      backgroundColor: c.control,
    },
    row: { alignItems: 'center', justifyContent: 'center' },
    value: {
      ...textVariants.body,
      fontSize: 26,
      lineHeight: 32,
      fontVariant: ['tabular-nums'],
      color: c.text,
    },
    label: { marginTop: spacing.xs },
  });
