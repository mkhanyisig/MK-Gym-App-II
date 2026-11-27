import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MetricCircle, type MetricCircleProps } from '@/components/MetricCircle';
import { spacing } from '@/theme';

type Props = {
  metrics: Omit<MetricCircleProps, 'size'>[];
  /** Width available to the grid (the page's content width). */
  width: number;
};

/** Below this circle size a row of four gets cramped, so switch to 2×2. */
const MIN_ROW_CIRCLE = 70;
const GAP = spacing.md;

/**
 * Lays out metric circles evenly: four in a row when there's room, otherwise 2×2
 * (narrow phones, or large system text where labels would collide).
 */
export function MetricGrid({ metrics, width }: Props) {
  const { fontScale } = useWindowDimensions();
  const rowSize = Math.floor((width - GAP * 3) / 4);
  const columns = rowSize >= MIN_ROW_CIRCLE && fontScale <= 1.3 ? 4 : 2;
  const size = columns === 4 ? Math.min(rowSize, 84) : Math.min(Math.floor((width - GAP) / 2) - spacing.lg, 96);
  const cellWidth = (width - GAP * (columns - 1)) / columns;

  return (
    <View style={styles.grid}>
      {metrics.map((metric) => (
        <View key={metric.label} style={{ width: cellWidth }}>
          <MetricCircle {...metric} size={size} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.lg },
});
