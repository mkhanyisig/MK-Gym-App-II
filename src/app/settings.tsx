import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { font, type ThemeColors, type ThemePreference, useAppTheme, useThemedStyles } from '@/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { preference, setPreference } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Screen scroll>
      <Card title="Appearance">
        <SegmentedControl
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
          accessibilityLabel="Theme"
        />
        <Text style={styles.hint}>
          {preference === 'system'
            ? "Follows your device's light or dark mode."
            : `Always ${preference}, whatever your device is set to.`}
        </Text>
      </Card>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    hint: { fontSize: font.small, color: c.textMuted },
  });
