import { Link, router } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { EllipseImage } from '@/components/EllipseImage';
import { Screen } from '@/components/Screen';
import { useProfile } from '@/hooks/useProfile';
import { font, spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

/** hero.jpg is 2320 × 3088 (portrait). */
const HERO_ASPECT = 3088 / 2320;

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const name = profile.nickname || profile.firstName;
  const window = useWindowDimensions();
  // Fit the ellipse to small screens too: whichever limit is tighter wins.
  const heroWidth = Math.min(window.width * 0.65, (window.height * 0.4) / HERO_ASPECT);

  return (
    <Screen style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gym Buddy 💪</Text>
        <Text style={styles.subtitle}>{name ? `Welcome back, ${name}.` : "Let's get it!"}</Text>
      </View>

      <View style={styles.hero}>
        <EllipseImage
          source={require('../../../assets/hero.jpg')}
          width={heroWidth}
          aspectRatio={HERO_ASPECT}
          borderColor={colors.primary}
          borderWidth={3}
        />
      </View>

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

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { justifyContent: 'space-between' },
    header: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
    title: { fontSize: 34, fontWeight: '800', color: c.primary },
    subtitle: { fontSize: font.body, color: c.textMuted },
    hero: { alignItems: 'center' },
    actions: { gap: spacing.sm, marginBottom: spacing.md },
    link: { textAlign: 'center', color: c.highlight, fontSize: font.body, padding: spacing.sm },
  });
