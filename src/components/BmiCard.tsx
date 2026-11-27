import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { bmiCategory, calculateBmi } from '@/lib/bmi';
import { font, type ThemeColors, useThemedStyles } from '@/theme';

export function BmiCard({ weightKg, heightCm }: { weightKg: number | null; heightCm: number | null }) {
  const styles = useThemedStyles(makeStyles);
  const bmi = calculateBmi(weightKg, heightCm);

  return (
    <Card title="Body Mass Index">
      {bmi == null ? (
        <Text style={styles.hint}>Enter your weight and height to see your BMI.</Text>
      ) : (
        <>
          <Text style={styles.value}>{bmi.toFixed(1)}</Text>
          <Text style={styles.category}>{bmiCategory(bmi)}</Text>
        </>
      )}
    </Card>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    value: { fontSize: 44, fontWeight: '800', color: c.highlight, textAlign: 'center' },
    category: { fontSize: font.heading, fontWeight: '600', textAlign: 'center', color: c.text },
    hint: { color: c.textMuted, fontSize: font.body },
  });
