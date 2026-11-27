import { SQLiteProvider } from 'expo-sqlite';
import { Component, type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/database';
import { spacing, type ThemeColors, useThemedStyles } from '@/theme';

/**
 * Opens the app's SQLite database and runs migrations before rendering the app.
 * Screens below can use `useSQLiteContext()`.
 *
 * If opening or migrating fails, SQLiteProvider throws (we deliberately don't pass
 * `onError`, which would leave a blank screen). The boundary below catches it and shows
 * an explicit error with a retry, so the app never runs against a missing or
 * half-migrated database.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  // Changing the key remounts SQLiteProvider, which reopens the database.
  const [attempt, setAttempt] = useState(0);

  return (
    <DatabaseErrorBoundary key={attempt} onRetry={() => setAttempt((n) => n + 1)}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
        {children}
      </SQLiteProvider>
    </DatabaseErrorBoundary>
  );
}

type BoundaryProps = { children: ReactNode; onRetry: () => void };

class DatabaseErrorBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Failed to open the My Form database', error);
  }

  render() {
    if (this.state.error) {
      return <DatabaseError message={this.state.error.message} onRetry={this.props.onRetry} />;
    }
    return this.props.children;
  }
}

function DatabaseError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AppText variant="title">Couldn’t open your data</AppText>
      <AppText tone="muted">
        My Form couldn’t open its on-device database, so nothing has been changed. Try again, or restart the
        app.
      </AppText>
      <AppText variant="small" tone="muted">
        {message}
      </AppText>
      <AppButton title="Try again" onPress={onRetry} />
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: c.background,
    },
  });
