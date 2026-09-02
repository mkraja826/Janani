import { StyleSheet, Text, View } from 'react-native';

import { JananiOverflowMenu } from '@/components/navigation/JananiOverflowMenu';
import { colors, radius, spacing } from '@/theme/tokens';

export function JananiPageHeader({ eyebrow, title, subtitle }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        {eyebrow ? <View style={styles.eyebrowPill}><Text style={styles.eyebrow}>{eyebrow}</Text></View> : null}
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
  copy: { flex: 1, paddingTop: 2 },
  eyebrowPill: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.rosePale,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.65,
    fontWeight: '900',
    color: colors.roseDark,
  },
  title: {
    maxWidth: 320,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.4,
    fontWeight: '900',
    color: colors.ink,
  },
  subtitle: {
    marginTop: spacing.sm,
    maxWidth: 335,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
});
