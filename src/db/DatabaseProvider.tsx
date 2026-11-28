import { SQLiteProvider } from 'expo-sqlite';
import { Component, type ReactNode, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppText } from '@/components/AppText';
import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/database';
import { isDatabaseLockedError, lockRetryDelay } from '@/db/openRetry';
import { spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

/**
 * Opens the app's SQLite database and runs migrations before rendering the app.
 * Screens below can use `useSQLiteContext()`.
 *
 * If opening or migrating fails, SQLiteProvider throws (we deliberately don't pass
 * `onError`, which would leave a blank screen). The boundary below catches it and shows
 * an explicit error with a retry, so the app never runs against a missing or
 * half-migrated database. A web file-lock error (see ./openRetry) is retried
 * automatically first, since it usually clears within a second or two.
 */
export function DatabaseProvider({ children }: { children: ReactNode }) {
  // Changing the key remounts SQLiteProvider, which reopens the database.
  const [attempt, setAttempt] = useState(0);
  // Automatic retries used so far; Try again starts a fresh round.
  const [autoRetries, setAutoRetries] = useState(0);

  return (
    <DatabaseErrorBoundary
      key={attempt}
      autoRetryDelay={lockRetryDelay(autoRetries)}
      onAutoRetry={() => {
        setAutoRetries((n) => n + 1);
        setAttempt((n) => n + 1);
      }}
      onRetry={() => {
        setAutoRetries(0);
        setAttempt((n) => n + 1);
      }}
    >
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
        {children}
      </SQLiteProvider>
    </DatabaseErrorBoundary>
  );
}

type BoundaryProps = {
  children: ReactNode;
  /** Wait before retrying a file-lock error by itself, or null when out of retries. */
  autoRetryDelay: number | null;
  onAutoRetry: () => void;
  onRetry: () => void;
};

class DatabaseErrorBoundary extends Component<BoundaryProps, { error: Error | null }> {
  state = { error: null as Error | null };
  private timer: ReturnType<typeof setTimeout> | undefined;

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  private willAutoRetry(error: Error | null) {
    return error != null && isDatabaseLockedError(error) && this.props.autoRetryDelay != null;
  }

  componentDidCatch(error: Error) {
    if (this.willAutoRetry(error)) {
      this.timer = setTimeout(this.props.onAutoRetry, this.props.autoRetryDelay ?? 0);
      return;
    }
    console.error('Failed to open the My Form database', error);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    const { error } = this.state;
    if (error && this.willAutoRetry(error)) return <DatabaseOpening />;
    if (error) {
      return (
        <DatabaseError
          message={error.message}
          locked={isDatabaseLockedError(error)}
          onRetry={this.props.onRetry}
        />
      );
    }
    return this.props.children;
  }
}

/** Shown while a locked database is retried, so a brief lock never flashes an error. */
function DatabaseOpening() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.container, styles.center]} accessibilityLiveRegion="polite">
      <ActivityIndicator color={colors.primary} />
      <AppText variant="small" tone="muted">
        Opening your data…
      </AppText>
    </View>
  );
}

function DatabaseError({
  message,
  locked,
  onRetry,
}: {
  message: string;
  locked: boolean;
  onRetry: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.container} accessibilityRole="alert">
      <AppText variant="title">Couldn’t open your data</AppText>
      <AppText tone="muted">
        {locked
          ? 'My Form is probably open in another browser tab or window, which is using your data. Close it, then try again. Nothing has been changed.'
          : 'My Form couldn’t open its on-device database, so nothing has been changed. Try again, or restart the app.'}
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
    center: { alignItems: 'center' },
  });
