import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';

type MenuDestination = '/settings' | '/reminders' | '/safety-privacy' | '/thinking-of-you';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
  destination: MenuDestination;
  onNavigate: (destination: MenuDestination) => void;
};

export function JananiOverflowMenu() {
  const [visible, setVisible] = useState(false);

  function navigate(destination: MenuDestination) {
    setVisible(false);
    router.push(destination);
  }

  return (
    <>
      <Pressable
        accessibilityLabel="More PregaLove options"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setVisible(true)}
        style={styles.trigger}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={colors.ink} />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={visible}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close menu"
            onPress={() => setVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.menu}>
            <View style={styles.menuHeader}>
              <View style={styles.brandIcon}>
                <Ionicons name="flower-outline" size={20} color={colors.roseDark} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.menuTitle}>PregaLove</Text>
                <Text style={styles.menuCaption}>More options</Text>
              </View>
              <Pressable
                accessibilityLabel="Close menu"
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <MenuItem
              caption="Family controls and partner settings"
              destination="/settings"
              icon="people-outline"
              label="Partner & family"
              onNavigate={navigate}
            />
            <MenuItem
              caption="Medicines, supplements and care reminders"
              destination="/reminders"
              icon="alarm-outline"
              label="Reminders"
              onNavigate={navigate}
            />
            <MenuItem
              caption="Send a little warmth to your partner"
              destination="/thinking-of-you"
              icon="heart-outline"
              label="Thinking of you"
              onNavigate={navigate}
            />
            <MenuItem
              caption="Understand PregaLove's safety and privacy choices"
              destination="/safety-privacy"
              icon="shield-checkmark-outline"
              label="Safety & privacy"
              onNavigate={navigate}
            />
            <MenuItem
              caption="Account, data and family controls"
              destination="/settings"
              icon="settings-outline"
              label="Settings"
              onNavigate={navigate}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function MenuItem({ icon, label, caption, destination, onNavigate }: MenuItemProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => onNavigate(destination)}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
    >
      <View style={styles.itemIcon}>
        <Ionicons name={icon} size={21} color={colors.roseDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.itemLabel}>{label}</Text>
        <Text style={styles.itemCaption}>{caption}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 62,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(49,42,42,0.18)',
  },
  menu: {
    width: '88%',
    maxWidth: 380,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blush,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trigger: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 70,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  itemPressed: {
    backgroundColor: colors.background,
  },
  itemIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blush,
  },
  flex: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '900', color: colors.ink },
  menuCaption: { marginTop: 2, fontSize: 12, color: colors.muted },
  itemLabel: { fontSize: 15, fontWeight: '800', color: colors.ink },
  itemCaption: { marginTop: 3, fontSize: 12, lineHeight: 17, color: colors.muted },
});
