import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';

export type LegalSection = { title: string; paragraphs: string[] };

type Props = {
  eyebrow: string;
  title: string;
  effectiveDate: string;
  notice?: string;
  sections: LegalSection[];
  footer?: string;
};

export function LegalDocumentScreen({ eyebrow, title, effectiveDate, notice, sections, footer }: Props) {
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.effective}>Effective date: {effectiveDate}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notice ? (
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={24} color={colors.rose} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.paragraphs.map((paragraph, index) => (
              <Text key={`${section.title}-${index}`} selectable style={styles.paragraph}>{paragraph}</Text>
            ))}
          </View>
        ))}

        {footer ? <Text style={styles.footer}>{footer}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},
  header:{flexDirection:'row',alignItems:'flex-start',gap:spacing.md,padding:spacing.lg,paddingBottom:spacing.md},
  backButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  flex:{flex:1},
  eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},
  title:{marginTop:4,fontSize:27,lineHeight:34,fontWeight:'900',color:colors.ink},
  effective:{marginTop:spacing.sm,fontSize:12,color:colors.muted},
  content:{paddingHorizontal:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},
  notice:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},
  noticeText:{flex:1,fontSize:14,lineHeight:21,fontWeight:'600',color:colors.roseDark},
  section:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  sectionTitle:{fontSize:17,lineHeight:23,fontWeight:'900',color:colors.ink},
  paragraph:{marginTop:spacing.md,fontSize:14,lineHeight:22,color:colors.muted},
  footer:{paddingHorizontal:spacing.md,textAlign:'center',fontSize:11,lineHeight:17,color:colors.muted},
});
