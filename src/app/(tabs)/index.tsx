import { Link, router } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { EmptyState } from '@/components/EmptyState';
import { HomeIllustration, useHomeIllustrationSize } from '@/components/HomeIllustration';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { StatBlock } from '@/components/StatBlock';
import { useNow } from '@/hooks/useNow';
import { useProfile } from '@/hooks/useProfile';
import { formatDateLabel, greeting } from '@/lib/greeting';
import { kgToLbs, round } from '@/lib/units';
import { spacing, type ThemeColors, useThemedStyles } from '@/theme';

/** Below this width FORM and FUNCTION stack instead of sitting side by side. */
const TWO_COLUMN_MIN_WIDTH = 360;

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const { profile, exists } = useProfile();
  const now = useNow();
  const { width } = useWindowDimensions();
  const illustrationSize = useHomeIllustrationSize();

  const name = profile.preferredName.trim() || profile.firstName.trim();
  const twoColumn = width >= TWO_COLUMN_MIN_WIDTH;

  const metric = profile.units === 'metric';
  const weight =
    profile.weightKg == null ? null : String(round(metric ? profile.weightKg : kgToLbs(profile.weightKg)));

  return (
    <Screen scroll>
      <View style={styles.page}>
        {/* Welcome */}
        <View style={styles.masthead}>
          <View style={styles.wordmarkRow}>
            <BrandMark />
            <AppText variant="wordmark" accessibilityRole="header" accessibilityLabel="My FORM.">
              My FORM<Text style={styles.stop}>.</Text>
            </AppText>
          </View>
          <AppText variant="label" tone="muted">
            Train with intention.
          </AppText>
        </View>

        <View style={styles.welcomeRow}>
          <View style={styles.welcome}>
            <AppText variant="label" tone="muted">
              {formatDateLabel(now)}
            </AppText>
            {exists ? (
              <AppText variant="label" tone="highlight">
                Welcome back
              </AppText>
            ) : null}
            <AppText variant="greeting">{greeting(now, name)}</AppText>
            {exists ? null : (
              <EmptyState
                message="Welcome to My FORM."
                action={{ label: 'Set up your profile', href: '/profile' }}
              />
            )}
          </View>
          <HomeIllustration size={illustrationSize} />
        </View>

        <Rule />

        {/* Today */}
        <View style={styles.section}>
          <SectionHeader title="Today" />
          <View style={styles.today}>
            <AppText variant="title">No session planned</AppText>
            <AppText variant="small" tone="muted">
              Begin an open session and log as you go.
            </AppText>
          </View>
          <AppButton title="Begin session  →" onPress={() => router.navigate('/timer')} />
        </View>

        <Rule />

        {/* FORM / FUNCTION */}
        <View style={[styles.stats, twoColumn && styles.statsRow]}>
          {weight != null ? (
            <StatBlock
              style={twoColumn ? styles.stat : undefined}
              label="Form"
              value={weight}
              unit={metric ? 'kg' : 'lbs'}
              caption="Current weight, from your profile"
              accessibilityLabel={`Form. Current weight ${weight} ${metric ? 'kilograms' : 'pounds'}.`}
            />
          ) : (
            <StatBlock style={twoColumn ? styles.stat : undefined} label="Form">
              <EmptyState
                message="Add your weight to start tracking your form."
                action={{ label: 'Add weight', href: '/profile' }}
              />
            </StatBlock>
          )}

          {twoColumn ? <View style={styles.columnRule} /> : <Rule />}

          <StatBlock style={twoColumn ? styles.stat : undefined} label="Function">
            <EmptyState message="No sessions logged yet. Your sessions this week will show here." />
          </StatBlock>
        </View>

        <Rule />

        {/* Recent */}
        <View style={styles.section}>
          <SectionHeader title="Recent" />
          <EmptyState message="Your journal is empty. Finished sessions will appear here." />
        </View>

        <Link href="/about" style={styles.about}>
          <AppText variant="label" tone="muted">
            About My FORM.
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    // Keep a readable measure on tablets and large web windows.
    page: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: spacing.lg, paddingBottom: spacing.lg },
    masthead: { gap: spacing.xs },
    wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    stop: { color: c.highlight },
    // Greeting on the left, illustration on the right; the greeting wraps if it needs to.
    welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    welcome: { flex: 1, gap: spacing.sm },
    section: { gap: spacing.md },
    today: { gap: spacing.xs },
    stats: { gap: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.md },
    stat: { flex: 1 },
    columnRule: { width: StyleSheet.hairlineWidth, backgroundColor: c.border },
    about: { alignSelf: 'center', paddingVertical: spacing.md },
  });
