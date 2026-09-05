import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { INDIA_REGION_OPTIONS, normalizeRegion, type DietPreference, type RegionalDietContext } from '@/features/diet/regionalDiet';
import { colors, radius, spacing } from '@/theme/tokens';

const STORAGE_KEY = 'pregalove:regional-diet-context:v1';
const DIETS: { value: DietPreference; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'non_vegetarian', label: 'Non-vegetarian' },
  { value: 'eggetarian', label: 'Eggetarian' },
  { value: 'vegan', label: 'Vegan' },
];

export async function readRegionalDietContext(): Promise<RegionalDietContext | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as RegionalDietContext; } catch { return null; }
}

export default function DietRegionScreen() {
  const [regionCode, setRegionCode] = useState('IN-TG');
  const [diet, setDiet] = useState<DietPreference>('vegetarian');

  useEffect(() => { void readRegionalDietContext().then((current) => { if (!current) return; if (current.regionCode) setRegionCode(current.regionCode); setDiet(current.dietPreference); }); }, []);

  async function save() {
    const option = INDIA_REGION_OPTIONS.find((item) => item.code === regionCode) ?? INDIA_REGION_OPTIONS[0];
    const context = normalizeRegion('IN', option.code, option.label, diet, 'manual');
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    router.back();
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Text style={styles.eyebrow}>REGIONAL FOOD</Text><Text style={styles.title}>Make food guidance feel local.</Text><Text style={styles.subtitle}>Choose your region and food preference. PregaLove uses this only to personalize meal ideas; precise GPS is not required.</Text></View>

    <View style={styles.card}><Text style={styles.sectionTitle}>My region</Text><View style={styles.wrap}>{INDIA_REGION_OPTIONS.map((item) => <Pressable key={item.code} onPress={() => setRegionCode(item.code)} style={[styles.chip, regionCode === item.code && styles.chipSelected]}><Text style={[styles.chipText, regionCode === item.code && styles.chipTextSelected]}>{item.label}</Text></Pressable>)}</View></View>

    <View style={styles.card}><Text style={styles.sectionTitle}>Food preference</Text><View style={styles.wrap}>{DIETS.map((item) => <Pressable key={item.value} onPress={() => setDiet(item.value)} style={[styles.chip, diet === item.value && styles.chipSelected]}><Text style={[styles.chipText, diet === item.value && styles.chipTextSelected]}>{item.label}</Text></Pressable>)}</View></View>

    <Pressable onPress={save} style={styles.primary}><Ionicons name="checkmark" size={20} color={colors.surface}/><Text style={styles.primaryText}>Use these preferences</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background}, content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl}, header:{gap:spacing.sm}, eyebrow:{fontSize:12,letterSpacing:2,fontWeight:'900',color:colors.rose}, title:{fontSize:30,lineHeight:37,fontWeight:'900',color:colors.ink}, subtitle:{fontSize:15,lineHeight:23,color:colors.muted}, card:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.md}, sectionTitle:{fontSize:17,fontWeight:'900',color:colors.ink}, wrap:{flexDirection:'row',flexWrap:'wrap',gap:spacing.sm}, chip:{paddingHorizontal:14,paddingVertical:10,borderRadius:radius.pill,borderWidth:1,borderColor:colors.border,backgroundColor:colors.background}, chipSelected:{backgroundColor:colors.rosePale,borderColor:colors.rose}, chipText:{fontSize:13,fontWeight:'700',color:colors.inkSoft}, chipTextSelected:{color:colors.roseDark}, primary:{minHeight:56,borderRadius:radius.pill,backgroundColor:colors.rose,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:spacing.sm}, primaryText:{fontSize:16,fontWeight:'900',color:colors.surface}
});
