import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PlaySubscriptionProduct } from '@/modules/janani-play-billing';
import {
  addPlayPurchaseListener,
  CARE_PLUS_PRODUCT_IDS,
  launchCarePlusPurchase,
  loadCarePlusProducts,
  restoreCarePlusPurchases,
  verifyPlayPurchase,
} from '@/features/billing/playBilling';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme/tokens';

type Entitlement = { active: boolean; planCode: string | null; currentPeriodEnd: string | null };

export default function CarePlusScreen() {
  const [status, setStatus] = useState<Entitlement | null>(null);
  const [products, setProducts] = useState<PlaySubscriptionProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingBusy, setBillingBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_own_care_plus_status');
    const raw = data as Record<string, unknown> | null;
    setStatus({
      active: Boolean(raw?.active),
      planCode: typeof raw?.planCode === 'string' ? raw.planCode : null,
      currentPeriodEnd: typeof raw?.currentPeriodEnd === 'string' ? raw.currentPeriodEnd : null,
    });
    try { setProducts(await loadCarePlusProducts()); } catch { setProducts([]); }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    let subscription: { remove(): void } | null = null;
    try {
      subscription = addPlayPurchaseListener((purchase) => {
        if (purchase.purchaseState === 'pending') {
          Alert.alert('Payment pending', 'Care+ will activate only after Google Play confirms the payment.');
          return;
        }
        if (purchase.purchaseState !== 'purchased') return;
        setBillingBusy(true);
        void verifyPlayPurchase(purchase)
          .then(() => load())
          .then(() => Alert.alert('Care+ activated', 'Your verified Google Play subscription is now linked to Janani.'))
          .catch((error) => Alert.alert('Could not verify purchase', error instanceof Error ? error.message : 'Please try Restore purchases.'))
          .finally(() => setBillingBusy(false));
      });
    } catch { /* Non-Android/web builds do not expose the billing module. */ }
    return () => subscription?.remove();
  }, [load]);

  const monthly = useMemo(() => products.find((p) => p.productId === CARE_PLUS_PRODUCT_IDS[0]), [products]);
  const annual = useMemo(() => products.find((p) => p.productId === CARE_PLUS_PRODUCT_IDS[1]), [products]);

  async function buy(productId: (typeof CARE_PLUS_PRODUCT_IDS)[number]) {
    setBillingBusy(true);
    try { await launchCarePlusPurchase(productId); }
    catch (error) { Alert.alert('Google Play purchase unavailable', error instanceof Error ? error.message : 'Please try again.'); setBillingBusy(false); }
  }

  async function restore() {
    setBillingBusy(true);
    try {
      const results = await restoreCarePlusPurchases();
      await load();
      Alert.alert(results.length ? 'Purchases restored' : 'No active Care+ purchase found', results.length ? 'Your verified subscription has been refreshed.' : 'Google Play did not return an active purchased Care+ subscription for this account.');
    } catch (error) {
      Alert.alert('Restore failed', error instanceof Error ? error.message : 'Please try again.');
    } finally { setBillingBusy(false); }
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.ink}/></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>JANANI CARE+</Text><Text style={styles.title}>Personalised support, with safety boundaries.</Text></View></View>

    {loading ? <ActivityIndicator color={colors.rose}/> : status?.active ? <View style={styles.activeCard}><Ionicons name="sparkles" size={28} color={colors.roseDark}/><Text style={styles.activeTitle}>Care+ is active</Text><Text style={styles.meta}>{status.planCode ?? 'Care+ subscription'}{status.currentPeriodEnd ? ` · verified until ${new Date(status.currentPeriodEnd).toLocaleDateString()}` : ''}</Text><Pressable style={styles.primary} onPress={() => router.push('/care-plus-assistant')}><Text style={styles.primaryText}>Open Care+ assistant</Text></Pressable></View> : <View style={styles.planCard}>
      <Text style={styles.planName}>Choose Care+</Text>
      <Feature text="Personalised daily wellbeing summaries"/><Feature text="Weekly meal ideas based on approved guidance"/><Feature text="Appointment preparation and health-trend summaries"/><Feature text="Up to 100 AI generations each month"/>
      <PlanButton title="Monthly" price={monthly?.formattedPrice ?? '₹99 / month'} disabled={!monthly || billingBusy} onPress={() => void buy(CARE_PLUS_PRODUCT_IDS[0])}/>
      <PlanButton title="Annual" price={annual?.formattedPrice ?? '₹799 / year'} disabled={!annual || billingBusy} onPress={() => void buy(CARE_PLUS_PRODUCT_IDS[1])}/>
      {!products.length ? <Text style={styles.small}>Google Play products are not available in this build/account yet. Configure the subscription products in Play Console and install a Play-distributed test build.</Text> : null}
      <Pressable disabled={billingBusy} onPress={() => void restore()} style={styles.restore}><Text style={styles.restoreText}>Restore purchases</Text></Pressable>
      {billingBusy ? <ActivityIndicator color={colors.rose}/> : null}
    </View>}

    <View style={styles.freeCard}><Text style={styles.sectionTitle}>Janani stays useful without Care+</Text><Text style={styles.body}>Pregnancy progress, reminders, journal, partner support, health records, basic food guidance, safety information, export and privacy controls remain available without AI.</Text></View>
    <View style={styles.safetyCard}><Ionicons name="shield-checkmark-outline" size={24} color={colors.roseDark}/><View style={styles.flex}><Text style={styles.sectionTitle}>AI does not replace your maternity team</Text><Text style={styles.body}>Care+ cannot diagnose a condition, change medicines, prescribe a dose, or guarantee that you or your baby are safe. Urgent concerns should go directly to your maternity care team.</Text></View></View>
  </ScrollView></SafeAreaView>;
}

function Feature({text}:{text:string}){return <View style={styles.feature}><Ionicons name="checkmark-circle" size={20} color={colors.rose}/><Text style={styles.featureText}>{text}</Text></View>}
function PlanButton({title,price,disabled,onPress}:{title:string;price:string;disabled:boolean;onPress:()=>void}){return <Pressable disabled={disabled} onPress={onPress} style={[styles.planButton,disabled&&styles.disabled]}><View><Text style={styles.planButtonTitle}>{title}</Text><Text style={styles.planPrice}>{price}</Text></View><Ionicons name="arrow-forward-circle" size={28} color={colors.roseDark}/></Pressable>}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.lg},header:{flexDirection:'row',gap:spacing.md,alignItems:'flex-start'},back:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},flex:{flex:1},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:spacing.xs,fontSize:28,lineHeight:35,fontWeight:'900',color:colors.ink},planCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,gap:spacing.sm},planName:{fontSize:20,fontWeight:'900',color:colors.roseDark,marginBottom:spacing.xs},feature:{flexDirection:'row',gap:spacing.sm,alignItems:'flex-start'},featureText:{flex:1,fontSize:14,lineHeight:20,color:colors.ink},planButton:{marginTop:spacing.sm,minHeight:66,paddingHorizontal:spacing.md,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},disabled:{opacity:.5},planButtonTitle:{fontSize:14,fontWeight:'900',color:colors.ink},planPrice:{marginTop:3,fontSize:13,color:colors.muted},restore:{minHeight:48,alignItems:'center',justifyContent:'center'},restoreText:{fontWeight:'800',color:colors.roseDark},small:{fontSize:11,lineHeight:17,color:colors.muted,textAlign:'center'},activeCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border,gap:spacing.sm},activeTitle:{fontSize:20,fontWeight:'900',color:colors.ink},meta:{fontSize:13,color:colors.muted},primary:{marginTop:spacing.sm,minHeight:50,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},primaryText:{fontWeight:'800',color:colors.surface},freeCard:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},safetyCard:{flexDirection:'row',gap:spacing.md,padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},sectionTitle:{fontSize:16,fontWeight:'900',color:colors.ink},body:{marginTop:spacing.sm,fontSize:13,lineHeight:20,color:colors.muted}});
