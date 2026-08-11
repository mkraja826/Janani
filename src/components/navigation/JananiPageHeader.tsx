import { StyleSheet, Text, View } from 'react-native';

import { JananiOverflowMenu } from '@/components/navigation/JananiOverflowMenu';
import { colors, spacing } from '@/theme/tokens';

export function JananiPageHeader({ eyebrow, title, subtitle }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <JananiOverflowMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: { flex: 1 },
  eyebrow: {
    marginBottom: spacing.xs,
    fontSize: 11,
    letterSpacing: 1.7,
    fontWeight: '800',
    color: colors.rose,
  },
  title: {
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '900',
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 330,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
});
