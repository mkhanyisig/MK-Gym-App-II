import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, router } from 'expo-router';
import type { ComponentProps, ComponentRef } from 'react';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { font, radius, spacing, type ThemeColors, useAppTheme, useThemedStyles } from '@/theme';

type MenuItem = { label: string; icon: ComponentProps<typeof Ionicons>['name']; href: Href };

/** App menu entries. Add future features here. */
const MENU_ITEMS: MenuItem[] = [{ label: 'Settings', icon: 'settings-outline', href: '/settings' }];

/** Top-left ☰ button that opens the app menu as a dropdown. */
export function MenuButton() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const buttonRef = useRef<ComponentRef<typeof Pressable>>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);

  const open = () =>
    buttonRef.current?.measureInWindow((x, y, _w, h) => setAnchor({ x, y: y + h + spacing.xs }));
  const close = () => setAnchor(null);

  const go = (href: Href) => {
    close();
    router.push(href);
  };

  return (
    <>
      <Pressable
        ref={buttonRef}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        hitSlop={8}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Ionicons name="menu" size={26} color={colors.text} />
      </Pressable>

      <Modal visible={anchor != null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close menu">
          <View style={[styles.menu, anchor && { left: anchor.x, top: anchor.y }]} accessibilityRole="menu">
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => go(item.href)}
                accessibilityRole="menuitem"
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <Ionicons name={item.icon} size={20} color={colors.text} />
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    button: { padding: spacing.xs, marginLeft: spacing.sm },
    pressed: { opacity: 0.6 },
    backdrop: { flex: 1 },
    menu: {
      position: 'absolute',
      minWidth: 180,
      paddingVertical: spacing.xs,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      shadowColor: c.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
    },
    itemPressed: { backgroundColor: c.background },
    itemLabel: { fontSize: font.body, color: c.text },
  });
