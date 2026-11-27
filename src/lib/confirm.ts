import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  /** Label for the confirming button, e.g. "Replace" or "Delete". */
  confirmLabel: string;
  /** Shows the confirming button as destructive on iOS. */
  destructive?: boolean;
};

/**
 * Asks the user to confirm an action and resolves true only if they do.
 * Native uses the platform alert. Web uses the browser's confirm dialog, because
 * react-native-web's Alert.alert does nothing.
 */
export function confirm({
  title,
  message,
  confirmLabel,
  destructive = false,
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      // Android: tapping outside the alert counts as cancel.
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
