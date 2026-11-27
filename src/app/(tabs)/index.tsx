import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HomeIllustration, useHomeIllustrationSize } from '@/components/HomeIllustration';
import type { MetricCircleProps } from '@/components/MetricCircle';
import { MetricGrid } from '@/components/MetricGrid';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useNow } from '@/hooks/useNow';
import { type Profile, useProfile } from '@/hooks/useProfile';
import { greeting, welcomeLine } from '@/lib/greeting';
import { kgToLbs, round } from '@/lib/units';
import { Text } from "react-native";
import { useAppTheme } from "@/theme";
import { radius, spacing, type ThemeColors, useThemedStyles } from '@/theme';

/** Matches the content width cap so the layout stays readable on tablets and wide windows. */
const MAX_CONTENT_WIDTH = 560;

/** Space between Home sections: airy, but tight enough to keep Begin Session in reach. */
const SECTION_GAP = 18;

/** How far the portrait may grow beyond its base size when there's spare height. */
const PORTRAIT_GROWTH = 1.5;

/** Below this height the wordmark and section spacing are tighter so Begin Session stays in view. */
const SHORT_SCREEN_HEIGHT = 720;

type Metric = Omit<MetricCircleProps, 'size'>;

/**
 * The four Home metrics. Only body weight has a real source today (the profile);
 * the others show neutral placeholders until workout sessions are recorded.
 * Each links to its section where one exists; Health has no section yet.
 */
function buildMetrics(profile: Profile): Metric[] {
  const metric = profile.units === 'metric';
  const weight =
    profile.weightKg == null ? null : String(round(metric ? profile.weightKg : kgToLbs(profile.weightKg)));

  return [
    weight != null
      ? {
          label: 'Weight',
          value: weight,
          unit: metric ? 'kg' : 'lbs',
          href: '/profile',
          accessibilityLabel: `Weight, ${weight} ${metric ? 'kilograms' : 'pounds'}. Opens your profile.`,
        }
      : {
          label: 'Weight',
          icon: 'scale-outline',
          caption: 'Add yours',
          href: '/profile',
          accessibilityLabel: 'Weight, not set. Opens your profile to add it.',
        },
    {
      label: 'Last workout',
      icon: 'barbell-outline',
      caption: 'None yet',
      href: '/workouts',
      accessibilityLabel: 'Last workout, none recorded yet. Opens your workout log.',
    },
    {
      label: 'This week',
      icon: 'calendar-outline',
      caption: 'No sessions',
      href: '/timer',
      accessibilityLabel: 'This week, no sessions recorded yet. Opens the timer to start one.',
    },
    {
      label: 'Health',
      icon: 'pulse-outline',
      caption: 'Coming soon',
      accessibilityLabel: 'Health metric, coming soon.',
    },
  ];
}

export default function HomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const { profile } = useProfile();
  const now = useNow();
  const { width, height } = useWindowDimensions();
  const short = height < SHORT_SCREEN_HEIGHT;
  const basePortraitSize = useHomeIllustrationSize();
  const { colors } = useAppTheme();

  const name = profile.preferredName.trim() || profile.firstName.trim();
  const contentWidth = Math.min(width - spacing.md * 2, MAX_CONTENT_WIDTH);
  // Visible height of the scroll area, so the first screen can end with Begin Session.
  const [viewportHeight, setViewportHeight] = useState(0);
  const firstScreenMinHeight = viewportHeight > 0 ? viewportHeight - spacing.md * 2 : undefined;
  // The portrait grows into the first screen's spare height, up to 1.5× its base diameter
  // (and never wider than the content). Short phones have no spare height, so it stays at base.
  const [portraitSlot, setPortraitSlot] = useState(0);
  const maxPortraitSize = Math.min(Math.round(basePortraitSize * PORTRAIT_GROWTH), contentWidth);
  const portraitSize = Math.min(Math.max(basePortraitSize, portraitSlot), maxPortraitSize);

  return (
    <Screen scroll onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}>
      <View style={styles.page}>
        {/* First screen: everything down to Begin Session, which sits at the bottom of the view.
            Recent starts just below, revealed by scrolling. */}
        <View
          style={[styles.firstScreen, short && styles.firstScreenCompact, { minHeight: firstScreenMinHeight }]}
        >
          <View style={styles.brand}>
            <View style={styles.titleBadge}>
              <AppText
              variant="wordmark"
              accessibilityRole="header"
              accessibilityLabel="My Form"
              numberOfLines={1}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1}
              style={[
                styles.center,
                styles.titleText,
                short && styles.wordmarkCompact,
              ]}
            >
              My FORM<Text style={{ color: colors.highlight }}>.</Text>
            </AppText>
            </View>
            <AppText variant="small" tone="muted" style={styles.center}>
              Train with intention.
            </AppText>
          </View>

          <View style={styles.greeting}>
            <AppText variant="greeting" style={styles.center}>
              {welcomeLine(name)}
            </AppText>
            <AppText variant="body" tone="muted" style={styles.center}>
              {greeting(now)}
            </AppText>
          </View>

          <View
            style={[styles.portrait, { minHeight: basePortraitSize }]}
            onLayout={(e) => setPortraitSlot(Math.floor(e.nativeEvent.layout.height))}
          >
            {/* Absolutely positioned so the slot's height comes only from the spare space,
                never from the image itself; it can then shrink if content above grows. */}
            <View style={styles.portraitFill}>
              <HomeIllustration size={portraitSize} />
            </View>
          </View>

          <MetricGrid metrics={buildMetrics(profile)} width={contentWidth} />

          <AppButton title="Begin session  →" onPress={() => router.navigate('/timer')} />
        </View>

        <View style={styles.recent}>
          <Rule />
          <SectionHeader title="Recent" />
          <EmptyState message="No sessions yet." />
        </View>

        <Link href="/about" style={styles.about}>
          <AppText variant="small" tone="muted">
            About My Form.
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    page: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', gap: SECTION_GAP },
    firstScreen: { gap: SECTION_GAP },
    firstScreenCompact: { gap: 12 },
    center: { textAlign: 'center' },
    wordmarkCompact: { fontSize: 68, lineHeight: 68 },
    brand: { alignItems: 'center', gap: spacing.sm },
    // Filled, rounded title block in the brand red.
    titleBadge: {
      backgroundColor: c.brand,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    titleText: { color: c.onBrand },
    greeting: { alignItems: 'center', gap: 2 },
    // Takes the first screen's spare height so the portrait can grow and Begin Session
    // stays at the bottom; any space beyond the portrait's maximum is split above and below it.
    portrait: { flexGrow: 1 },
    portraitFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
    recent: { gap: spacing.md },
    about: { alignSelf: 'center', paddingVertical: spacing.md },
  });
