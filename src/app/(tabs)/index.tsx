import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { HomeIllustration } from '@/components/HomeIllustration';
import { MenuButton } from '@/components/MenuButton';
import type { MetricCircleProps } from '@/components/MetricCircle';
import { MetricGrid } from '@/components/MetricGrid';
import { Rule } from '@/components/Rule';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { useNow } from '@/hooks/useNow';
import { type Profile, useProfile } from '@/hooks/useProfile';
import { greeting, welcomeLine } from '@/lib/greeting';
import { formatWeight } from '@/lib/units';
import { fontFamily, spacing, type ThemeColors, useThemedStyles } from '@/theme';

/** Matches the content width cap so the layout stays readable on tablets and wide windows. */
const MAX_CONTENT_WIDTH = 560;

/** Space between Home sections: airy, but tight enough to keep Begin Session in reach. */
const SECTION_GAP = 18;

/**
 * The portrait fills whatever height is left on the first screen, between these limits.
 * Below the minimum (very short phones) the page scrolls instead of shrinking it further.
 */
const MIN_PORTRAIT_SIZE = 140;
const MAX_PORTRAIT_SIZE = 470;

/** Below this height the wordmark and section spacing are tighter so Begin Session stays in view. */
const SHORT_SCREEN_HEIGHT = 720;

type Metric = Omit<MetricCircleProps, 'size'>;

/**
 * The four Home metrics. Only body weight has a real source today (the profile);
 * the others show neutral placeholders until workout sessions are recorded.
 * Each links to its section where one exists; Health has no section yet.
 */
function buildMetrics(profile: Profile): Metric[] {
  const weight = formatWeight(profile.weightKg, profile.units);

  return [
    weight != null
      ? {
          label: 'Weight',
          value: weight.value,
          unit: weight.unit,
          href: '/weight',
          accessibilityLabel: `Weight, ${weight.spoken}. Opens your weigh-ins.`,
        }
      : {
          label: 'Weight',
          icon: 'scale-outline',
          caption: 'Add yours',
          href: '/weight',
          accessibilityLabel: 'Weight, not set. Opens your weigh-ins to log one.',
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

  const name = profile.preferredName.trim() || profile.firstName.trim();
  const contentWidth = Math.min(width - spacing.md * 2, MAX_CONTENT_WIDTH);
  // Visible height of the scroll area, so the first screen can end with Begin Session.
  const [viewportHeight, setViewportHeight] = useState(0);
  const firstScreenMinHeight = viewportHeight > 0 ? viewportHeight - spacing.md * 2 : undefined;
  // The portrait takes all the height the rest of the first screen leaves over, so
  // everything from the title to Begin Session fits on screen. Never wider than the screen.
  const [portraitSlot, setPortraitSlot] = useState(0);
  const maxPortraitSize = Math.min(width, MAX_PORTRAIT_SIZE);
  const portraitSize = Math.min(Math.max(portraitSlot, MIN_PORTRAIT_SIZE), maxPortraitSize);

  return (
    <Screen scroll onLayout={(e) => setViewportHeight(e.nativeEvent.layout.height)}>
      <View style={styles.page}>
        {/* First screen: everything from the title to Begin Session fills the visible area.
            Recent starts just below, revealed by scrolling. */}
        <View
          style={[
            styles.firstScreen,
            short && styles.firstScreenCompact,
            { minHeight: firstScreenMinHeight },
          ]}
        >
          {/* Home has no header bar: the menu sits beside the title, and its dropdown
              opens as an overlay, so no space is reserved for it. */}
          <View style={styles.brand}>
            <MenuButton />
            <View style={styles.titleBadge}>
              <AppText
                variant="wordmark"
                accessibilityRole="header"
                accessibilityLabel="My Form"
                numberOfLines={1}
                adjustsFontSizeToFit
                maxFontSizeMultiplier={1}
                style={[styles.center, styles.titleText, short && styles.wordmarkCompact]}
              >
                My FORM<Text style={styles.titleStop}>.</Text>
              </AppText>

              <AppText variant="small" style={[styles.center, styles.tagline]}>
                Train with intention.
              </AppText>
            </View>
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
            style={[styles.portrait, { minHeight: MIN_PORTRAIT_SIZE }]}
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
    wordmarkCompact: { fontSize: 70, lineHeight: 72 },
    // Menu button and title block share the top row. The button is pinned to the
    // top-left corner, and the row is pulled up toward the status bar.
    brand: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: -spacing.sm },
    // The brand block fills the rest of the row, holding the wordmark and tagline.
    titleBadge: {
      flex: 1,
      backgroundColor: c.brand,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingTop: 2,
      paddingBottom: spacing.sm + 2,
    },
    titleText: { color: c.onBrand },
    // The full stop and tagline share onBrandAccent, so they always match.
    titleStop: { color: c.onBrandAccent },
    // Gold on the red block (4.84:1), matching the full stop; the small top margin keeps
    // the "y" descender in "My" from crowding it.
    tagline: {
      fontFamily: fontFamily.sansSemiBold,
      fontSize: 16,
      lineHeight: 20,
      color: c.onBrandAccent,
      marginTop: spacing.xs,
    },
    greeting: { alignItems: 'center', gap: 2 },
    // Takes the first screen's spare height; the portrait is sized to it (see portraitSize),
    // and any space beyond the portrait's maximum is split above and below it.
    portrait: { flexGrow: 1 },
    portraitFill: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recent: { gap: spacing.md },
    about: { alignSelf: 'center', paddingVertical: spacing.md },
  });
