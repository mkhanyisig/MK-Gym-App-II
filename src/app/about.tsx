import { StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, font } from '@/theme';

export default function AboutScreen() {
  return (
    <Screen scroll>
      <Text style={styles.heading}>Gym Buddy 💪</Text>
      <Text style={styles.body}>
        Log and track your gym workouts and body measurements, and get insights on how you&apos;re improving.
      </Text>
      <Text style={styles.body}>
        Originally built for COSI 153a: Mobile App Development (Fall 2021) by Mkhanyisi Gamedze, and rebuilt in
        2026 on a modern Expo stack.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: font.title, fontWeight: '800', color: colors.accent },
  body: { fontSize: font.body, lineHeight: 24, color: colors.text },
});
