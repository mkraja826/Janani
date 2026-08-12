import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type MenuDestination = '/partner-family' | '/language' | '/settings' | '/reminders' | '/safety-privacy';

type MenuItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
  destination: MenuDestination;
  onNavigate: (destination: MenuDestination) => void;
};

export function JananiOverflowMenu() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  function navigate(destination: MenuDestination) {
    setVisible(false);
    router.push(destination);
  }

  return (
    <>
      <Pressable
        accessibilityLabel="More Janani options"
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
                <Text style={styles.menuTitle}>Janani</Text>
                <Text style={styles.menuCaption}>{t('menu.more')}</Text>
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
              caption={t('menu.partnerCaption')}
              destination="/partner-family"
              icon="people-outline"
              label={t('menu.partner')}
              onNavigate={navigate}
            />
            <MenuItem
              caption={t('menu.languageCaption')}
              destination="/language"
              icon="language-outline"
              label={t('menu.language')}
              onNavigate={navigate}
            />
            <MenuItem
              caption={t('menu.remindersCaption')}
              destination="/reminders"
              icon="alarm-outline"
              label={t('menu.reminders')}
              onNavigate={navigate}
            />
            <MenuItem
              caption={t('menu.safetyCaption')}
              destination="/safety-privacy"
              icon="shield-checkmark-outline"
              label={t('menu.safety')}
              onNavigate={navigate}
            />
            <MenuItem
              caption={t('menu.settingsCaption')}
              destination="/settings"
              icon="settings-outline"
              label={t('menu.settings')}
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
