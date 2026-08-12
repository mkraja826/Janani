import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';
import type { MedicalReportDetail } from './reportTypes';

type Props = {
  report: MedicalReportDetail;
  onComplete: () => Promise<void>;
};

function statusCopy(report: MedicalReportDetail): { title: string; body: string } {
  switch (report.extractionStatus) {
    case 'processing':
    case 'queued':
      return {
        title: 'Janani is reading this report',
        body: 'A secure copy is being processed by Janani’s configured document-reading provider. Anything it reads will still need your review before it can be trusted.',
      };
    case 'needs_confirmation':
      return {
        title: 'Please review what Janani read',
        body: `${report.proposedFacts} proposed value${report.proposedFacts === 1 ? '' : 's'} ${report.proposedFacts === 1 ? 'is' : 'are'} waiting below.`,
      };
    case 'confirmed':
      return {
        title: 'Report reviewed',
        body: 'Only the values you confirmed or corrected are eligible for future Janani context.',
      };
    case 'not_available':
      return {
        title: 'No reliable values were found automatically',
        body: 'You can try reading the report again or add an important value manually from the original.',
      };
    case 'failed':
      return {
        title: 'Automatic reading did not finish',
        body: 'Your original report remains stored privately in Janani. You can try again or add important values manually.',
      };
    default:
      return {
        title: 'Let Janani read the written report',
        body: 'If you choose automatic reading, a secure copy is sent to Janani’s configured document-reading provider. It can propose visible values and written findings, but it will not diagnose from raw scan imagery.',
      };
  }
}

export function ReportExtractionCard({ report, onComplete }: Props) {
  const [reading, setReading] = useState(false);
  const copy = statusCopy(report);
  const hasProposals = report.proposedFacts > 0 || report.extractionStatus === 'needs_confirmation';
  const canRead = report.uploadState === 'uploaded'
    && !reading
    && !hasProposals
    && report.extractionStatus !== 'processing'
    && report.extractionStatus !== 'queued'
    && report.extractionStatus !== 'confirmed';

  function requestReadConsent() {
    if (!canRead) return;
    Alert.alert(
      'Read this report automatically?',
      'To extract visible text and values, Janani will securely send a copy of this report to its configured document-reading provider. Nothing it reads becomes trusted medical information until you confirm or correct it.',
      [
        { text: 'Not now', style: 'cancel' },
        { text: 'Read report', onPress: () => void readReport() },
      ],
    );
  }

  async function readReport() {
    if (!canRead) return;
    setReading(true);
    const { data, error } = await supabase.functions.invoke('extract-medical-report', {
      body: { report_id: report.id },
    });
    setReading(false);

    if (error) {
      const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
      let payload: { error?: unknown; code?: unknown } | null = null;
      if (context?.json) {
        payload = await context.json().catch(() => null) as { error?: unknown; code?: unknown } | null;
      }
      const message = typeof payload?.error === 'string'
        ? payload.error
        : 'Janani could not read this report automatically. You can still add important values manually.';
      Alert.alert('Automatic reading unavailable', message);
      await onComplete();
      return;
    }

    const proposed = typeof data?.proposed_fact_count === 'number' ? data.proposed_fact_count : 0;
    await onComplete();
    if (proposed > 0) {
      Alert.alert(
        'Report ready for your review',
        `Janani found ${proposed} possible value${proposed === 1 ? '' : 's'}. Please compare each one with the original before confirming it.`,
      );
    } else {
      Alert.alert(
        'Nothing reliable to confirm',
        'Janani did not find structured values it could safely propose. You can still add important values manually from the original report.',
      );
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        {reading || report.extractionStatus === 'processing' || report.extractionStatus === 'queued' ? (
          <ActivityIndicator color={colors.roseDark} />
        ) : (
          <Ionicons name="sparkles-outline" size={22} color={colors.roseDark} />
        )}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{copy.body}</Text>
        {canRead ? (
          <Pressable onPress={requestReadConsent} style={styles.button}>
            <Ionicons name="scan-outline" size={18} color={colors.surface} />
            <Text style={styles.buttonText}>{report.extractionStatus === 'failed' || report.extractionStatus === 'not_available' ? 'Try reading again' : 'Read this report'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blush,
  },
  copy: { flex: 1 },
  title: { fontSize: 16, fontWeight: '900', color: colors.ink },
  body: { marginTop: spacing.xs, fontSize: 13, lineHeight: 20, color: colors.muted },
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.roseDark,
  },
  buttonText: { fontSize: 14, fontWeight: '900', color: colors.surface },
});
