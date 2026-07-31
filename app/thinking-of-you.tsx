import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

type Nudge = { id: string; sender_id: string; message: string; created_at: string; acknowledged_at: string | null };
const messages = ['Thinking of you', 'You are not alone', 'Please take a little rest', 'I am proud of you'];

export default function ThinkingOfYouScreen() {
  const { session } = useAuth();
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('partner_nudges').select('id, sender_id, message, created_at, acknowledged_at').order('created_at', { ascending: false }).limit(30);
    if (error) Alert.alert('Could not load messages', error.message);
    else setNudges((data ?? []) as Nudge[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function send(message: string) {
    setSending(message);
    const { error } = await supabase.rpc('send_partner_nudge', { p_message: message });
    setSending(null);
    if (error) Alert.alert('Could not send warmth', error.message);
    else { Alert.alert('Sent with love', 'Your partner will see that you were thinking of them.'); load(); }
  }

  async function acknowledge(id: string) {
    const { error } = await supabase.rpc('acknowledge_partner_nudge', { p_nudge_id: id });
    if (!error) setNudges((items) => items.map((item) => item.id === id ? { ...item, acknowledged_at: new Date().toISOString() } : item));
  }

  return <SafeAreaView style={styles.page}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><View style={styles.flex}><Text style={styles.eyebrow}>A SMALL CONNECTION</Text><Text style={styles.title}>Thinking of you</Text></View></View>
      <View style={styles.hero}><View style={styles.heart}><Ionicons name="heart" size={34} color={colors.rose} /></View><Text style={styles.heroTitle}>Sometimes one little tap says enough.</Text><Text style={styles.heroText}>Send a gentle note to your partner without needing to start a conversation.</Text></View>
      <View style={styles.messageGrid}>{messages.map((message) => <Pressable key={message} disabled={!!sending} onPress={() => send(message)} style={styles.messageCard}><Ionicons name="heart-outline" size={22} color={colors.rose} /><Text style={styles.messageText}>{message}</Text>{sending === message && <ActivityIndicator size="small" color={colors.rose} />}</Pressable>)}</View>
      <Text style={styles.sectionTitle}>Recent warmth</Text>
      {loading ? <ActivityIndicator color={colors.rose} /> : nudges.length === 0 ? <View style={styles.empty}><Text style={styles.emptyText}>Your shared moments will appear here.</Text></View> : nudges.map((nudge) => {
        const incoming = nudge.sender_id !== session?.user.id;
        return <View key={nudge.id} style={[styles.nudge, incoming && styles.incoming]}><View style={styles.nudgeTop}><Text style={styles.nudgeFrom}>{incoming ? 'From your partner' : 'Sent by you'}</Text><Text style={styles.time}>{new Date(nudge.created_at).toLocaleString([], { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' })}</Text></View><Text style={styles.nudgeMessage}>{nudge.message}</Text>{incoming && !nudge.acknowledged_at && <Pressable onPress={() => acknowledge(nudge.id)} style={styles.ack}><Text style={styles.ackText}>Send a heart back</Text><Ionicons name="heart" size={16} color={colors.surface} /></Pressable>}</View>;
      })}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:colors.background},content:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.xl},header:{flexDirection:'row',alignItems:'center',gap:spacing.md},flex:{flex:1},iconButton:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},title:{marginTop:3,fontSize:29,fontWeight:'800',color:colors.ink},hero:{alignItems:'center',padding:spacing.xl,borderRadius:radius.lg,backgroundColor:colors.blush,borderWidth:1,borderColor:colors.border},heart:{width:70,height:70,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface},heroTitle:{marginTop:spacing.md,textAlign:'center',fontSize:21,lineHeight:28,fontWeight:'800',color:colors.ink},heroText:{marginTop:spacing.sm,textAlign:'center',fontSize:14,lineHeight:21,color:colors.muted},messageGrid:{gap:spacing.sm},messageCard:{minHeight:58,flexDirection:'row',alignItems:'center',gap:spacing.md,paddingHorizontal:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},messageText:{flex:1,fontSize:15,fontWeight:'800',color:colors.ink},sectionTitle:{fontSize:19,fontWeight:'800',color:colors.ink},empty:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},emptyText:{textAlign:'center',color:colors.muted},nudge:{padding:spacing.lg,borderRadius:radius.lg,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},incoming:{backgroundColor:colors.sageSoft},nudgeTop:{flexDirection:'row',justifyContent:'space-between',gap:spacing.md},nudgeFrom:{fontSize:12,fontWeight:'800',color:colors.rose},time:{fontSize:11,color:colors.muted},nudgeMessage:{marginTop:spacing.md,fontSize:18,lineHeight:25,fontWeight:'800',color:colors.ink},ack:{alignSelf:'flex-start',marginTop:spacing.md,flexDirection:'row',alignItems:'center',gap:spacing.sm,paddingHorizontal:spacing.md,paddingVertical:10,borderRadius:radius.pill,backgroundColor:colors.rose},ackText:{fontSize:12,fontWeight:'800',color:colors.surface}
});