import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { font, type ThemeColors, useThemedStyles } from '@/theme';

export default function AboutScreen() {
  const styles = useThemedStyles(makeStyles);
  return (
    <Screen scroll>
      <Text style={styles.heading}>My Form.</Text>
      <Text style={styles.body}>
        Log and track your gym workouts and body measurements, and get insights on how you&apos;re improving.
      </Text>
      <Text style={styles.body}>
        Originally built as Gym Buddy for COSI 153a: Mobile App Development (Fall 2021) by Mkhanyisi Gamedze,
        and rebuilt in 2026 on a modern Expo stack.
      </Text>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    heading: { fontSize: font.title, fontWeight: '800', color: c.primary },
    body: { fontSize: font.body, lineHeight: 24, color: c.text },
  });
