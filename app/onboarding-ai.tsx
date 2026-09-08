import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type Extracted = {
  weeks?: number;
  diet?: 'vegetarian' | 'non-vegetarian';
  conditions: string[];
  medicines: string[];
};

function extractPreview(input: string): Extracted {
  const text = input.toLowerCase();
  const weekMatch = text.match(/\b(\d{1,2})\s*(?:weeks?|wks?)\b/);
  const conditions = ['thyroid', 'diabetes', 'gestational diabetes', 'bp', 'hypertension', 'pcos'].filter((item) => text.includes(item));
  const medicines = Array.from(input.matchAll(/(?:take|taking|prescribed|medicine|tablet)\s+([A-Za-z][A-Za-z0-9 -]{2,28})/gi)).map((match) => match[1].trim());
  const diet = text.includes('non veg') || text.includes('non-veg') || text.includes('nonvegetarian') ? 'non-vegetarian' : text.includes('vegetarian') || text.includes('veg') ? 'vegetarian' : undefined;
  return { weeks: weekMatch ? Number(weekMatch[1]) : undefined, diet, conditions: [...new Set(conditions)], medicines: [...new Set(medicines)] };
}

export default function AiOnboardingScreen() {
  const [story, setStory] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const preview = useMemo(() => extractPreview(story), [story]);
  const hasPreview = Boolean(preview.weeks || preview.diet || preview.conditions.length || preview.medicines.length);

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}>
      <View style={styles.icon}><Ionicons name="sparkles" size={24} color={colors.surface}/></View>
      <Text style={styles.eyebrow}>AI-ASSISTED SETUP</Text>
      <Text style={styles.title}>Tell me about your pregnancy in your own words.</Text>
      <Text style={styles.subtitle}>You can keep it simple. PregaLove will organize what you say, then you review it before anything is saved.</Text>
    </View>

    <View style={styles.exampleCard}><Text style={styles.exampleLabel}>Example</Text><Text style={styles.example}>“I’m 14 weeks, vegetarian, have thyroid, and take calcium after dinner.”</Text></View>

    <View style={styles.inputCard}>
      <TextInput multiline value={story} onChangeText={(value) => { setStory(value); setReviewing(false); }} placeholder="Tell PregaLove about your pregnancy…" placeholderTextColor={colors.muted} style={styles.input}/>
      <View style={styles.inputActions}><Pressable disabled style={styles.voiceButton}><Ionicons name="mic-outline" size={20} color={colors.muted}/><Text style={styles.voiceText}>Voice coming next</Text></Pressable><Pressable disabled={story.trim().length < 8} onPress={() => setReviewing(true)} style={[styles.reviewButton, story.trim().length < 8 && styles.disabled]}><Text style={styles.reviewButtonText}>Review</Text></Pressable></View>
    </View>

    {reviewing ? <View style={styles.reviewCard}>
      <Text style={styles.reviewTitle}>Here’s what I understood</Text>
      {!hasPreview ? <Text style={styles.emptyText}>I still need a few basics. Continue and PregaLove will ask only for what is missing.</Text> : null}
      {preview.weeks ? <Row icon="calendar-outline" label="Pregnancy" value={`${preview.weeks} weeks`} /> : null}
      {preview.diet ? <Row icon="nutrition-outline" label="Diet" value={preview.diet} /> : null}
      {preview.conditions.length ? <Row icon="medical-outline" label="Health" value={preview.conditions.join(', ')} /> : null}
      {preview.medicines.length ? <Row icon="medkit-outline" label="Medicines" value={preview.medicines.join(', ')} /> : null}
      <Text style={styles.safety}>Nothing is saved from this screen yet. Important health and medicine details will always be confirmed before PregaLove uses them.</Text>
      <Pressable onPress={() => router.replace({ pathname: '/onboarding', params: { role: 'mother', ai_note: story } })} style={styles.primary}><Text style={styles.primaryText}>Looks right — continue</Text><Ionicons name="arrow-forward" size={19} color={colors.surface}/></Pressable>
      <Pressable onPress={() => setReviewing(false)} style={styles.secondary}><Text style={styles.secondaryText}>Edit what I said</Text></Pressable>
    </View> : null}

    <Pressable onPress={() => router.replace({ pathname: '/onboarding', params: { role: 'mother' } })} style={styles.manual}><Text style={styles.manualText}>Prefer the simple form instead</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

function Row({icon,label,value}:{icon:keyof typeof Ionicons.glyphMap;label:string;value:string}) { return <View style={styles.row}><View style={styles.rowIcon}><Ionicons name={icon} size={18} color={colors.roseDark}/></View><View style={styles.rowCopy}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View><Ionicons name="checkmark-circle" size={20} color={colors.sage}/></View>; }

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{gap:spacing.md,paddingTop:spacing.md},icon:{width:52,height:52,borderRadius:radius.lg,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},eyebrow:{fontSize:11,letterSpacing:2.2,fontWeight:'900',color:colors.rose},title:{fontSize:typography.display,lineHeight:42,fontWeight:'900',color:colors.ink},subtitle:{fontSize:15,lineHeight:23,color:colors.muted},exampleCard:{padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.rosePale,borderWidth:1,borderColor:colors.border},exampleLabel:{fontSize:11,fontWeight:'900',letterSpacing:1.4,color:colors.roseDark},example:{marginTop:6,fontSize:14,lineHeight:21,color:colors.inkSoft},inputCard:{padding:spacing.md,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.md},input:{minHeight:150,textAlignVertical:'top',fontSize:16,lineHeight:23,color:colors.ink},inputActions:{flexDirection:'row',gap:spacing.sm},voiceButton:{flex:1,minHeight:48,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},voiceText:{fontSize:12,fontWeight:'700',color:colors.muted},reviewButton:{minWidth:110,minHeight:48,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},reviewButtonText:{fontWeight:'900',color:colors.surface},disabled:{opacity:.45},reviewCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.md},reviewTitle:{fontSize:20,fontWeight:'900',color:colors.ink},emptyText:{fontSize:14,lineHeight:21,color:colors.muted},row:{flexDirection:'row',alignItems:'center',gap:spacing.md,paddingVertical:spacing.sm},rowIcon:{width:38,height:38,borderRadius:radius.md,alignItems:'center',justifyContent:'center',backgroundColor:colors.blush},rowCopy:{flex:1},rowLabel:{fontSize:11,fontWeight:'800',color:colors.muted},rowValue:{marginTop:2,fontSize:15,fontWeight:'800',color:colors.ink},safety:{fontSize:12,lineHeight:18,color:colors.muted},primary:{minHeight:54,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:spacing.sm,backgroundColor:colors.rose},primaryText:{fontSize:15,fontWeight:'900',color:colors.surface},secondary:{minHeight:46,alignItems:'center',justifyContent:'center'},secondaryText:{fontWeight:'800',color:colors.roseDark},manual:{minHeight:44,alignItems:'center',justifyContent:'center'},manualText:{fontSize:13,fontWeight:'700',color:colors.muted}});
