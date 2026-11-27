import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { BmiCard } from '@/components/BmiCard';
import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { MeasurementsForm } from '@/components/MeasurementsForm';
import { Screen } from '@/components/Screen';
import { type Profile, useProfile } from '@/hooks/useProfile';
import { font, spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { profile, loading, save, clear } = useProfile();
  const [draft, setDraft] = useState<Profile>(profile);
  // Bumped whenever the draft is replaced wholesale, so the measurements form re-syncs.
  const [formVersion, setFormVersion] = useState(0);

  // When the stored profile changes (initial load, save, clear), reset the draft to match.
  const [syncedProfile, setSyncedProfile] = useState(profile);
  if (syncedProfile !== profile) {
    setSyncedProfile(profile);
    setDraft(profile);
    setFormVersion((v) => v + 1);
  }

  const set = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  const onSave = async () => {
    await save(draft);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const onClear = () =>
    Alert.alert('Clear profile?', 'This removes all saved profile data from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => void clear() },
    ]);

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const metric = draft.units === 'metric';

  return (
    <Screen scroll>
      <Text style={styles.title}>Profile</Text>

      <Card title="Personal info">
        <View style={styles.row}>
          <FormField flex={1} label="First name" value={draft.firstName} onChangeText={(t) => set('firstName', t)} />
          <FormField flex={1} label="Last name" value={draft.lastName} onChangeText={(t) => set('lastName', t)} />
        </View>
        <FormField
          label="Preferred name"
          value={draft.preferredName}
          onChangeText={(t) => set('preferredName', t)}
          placeholder="What should we call you?"
          autoComplete="name-given"
        />
        <FormField
          label="Date of birth"
          value={draft.dateOfBirth}
          onChangeText={(t) => set('dateOfBirth', t)}
          placeholder="MM/DD/YYYY"
        />
        <FormField
          label="Email"
          value={draft.email}
          onChangeText={(t) => set('email', t)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </Card>

      <Card title={`Body measurements ${metric ? '🇬🇧' : '🇺🇸'}`}>
        <View style={styles.toggle}>
          <Text style={styles.toggleLabel}>{metric ? 'Metric (kg, cm)' : 'Imperial (lbs, ft/in)'}</Text>
          <Switch
            value={metric}
            onValueChange={(v) => {
              set('units', v ? 'metric' : 'imperial');
              setFormVersion((n) => n + 1);
            }}
            trackColor={{ true: colors.highlight, false: colors.border }}
            thumbColor={metric ? colors.onPrimary : undefined}
            // react-native-web colors the "on" thumb with activeThumbColor instead.
            {...{ activeThumbColor: colors.onPrimary }}
          />
        </View>
        <MeasurementsForm
          key={`${draft.units}-${formVersion}`}
          units={draft.units}
          weightKg={draft.weightKg}
          heightCm={draft.heightCm}
          onChange={(m) => setDraft((d) => ({ ...d, ...m }))}
        />
      </Card>

      <BmiCard weightKg={draft.weightKg} heightCm={draft.heightCm} />

      <View style={styles.actions}>
        <AppButton title="Save" onPress={onSave} disabled={!dirty} />
        {dirty ? (
          <AppButton
            title="Discard changes"
            variant="secondary"
            onPress={() => {
              setDraft(profile);
              setFormVersion((v) => v + 1);
            }}
          />
        ) : null}
        <AppButton title="Clear profile" variant="danger" onPress={onClear} />
      </View>
    </Screen>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: font.title, fontWeight: '800', color: c.text },
    row: { flexDirection: 'row', gap: spacing.md },
    toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    toggleLabel: { fontSize: font.body, color: c.text },
    actions: { gap: spacing.sm, marginBottom: spacing.xl },
  });
