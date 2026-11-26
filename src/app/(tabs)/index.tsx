import { Link, router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/hooks/useProfile';
import { colors, font, spacing } from '@/theme';

export default function HomeScreen() {
  const { profile } = useProfile();
  const name = profile.nickname || profile.firstName;

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gym Buddy 💪</Text>
        <Text style={styles.subtitle}>{name ? `Welcome back, ${name}.` : "Let's get it!"}</Text>
      </View>

      <Image source={require('../../../assets/hero.jpg')} style={styles.hero} resizeMode="cover" />

      <View style={styles.actions}>
        <AppButton title="Start a workout" onPress={() => router.navigate('/timer')} />
        <AppButton title="View workout log" variant="secondary" onPress={() => router.navigate('/workouts')} />
        <Link href="/about" style={styles.link}>
          About Gym Buddy
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'space-between' },
  header: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  title: { fontSize: 34, fontWeight: '800', color: colors.accent },
  subtitle: { fontSize: font.body, color: colors.textMuted },
  hero: {
    width: '85%',
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
  link: { textAlign: 'center', color: colors.info, fontSize: font.body, padding: spacing.sm },
});
