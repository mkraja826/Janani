import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isTransientError } from '@/lib/errors';
import { enqueueMutation } from '@/lib/offlineQueue';
import { supabase } from '@/lib/supabase';
import { randomUuid } from '@/lib/uuid';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';

const moods = [{v:1,e:'😞'},{v:2,e:'😕'},{v:3,e:'😌'},{v:4,e:'🙂'},{v:5,e:'🥰'}];

export default function EditJournalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [title,setTitle]=useState(''); const [body,setBody]=useState(''); const [mood,setMood]=useState<number|null>(null); const [shared,setShared]=useState(false); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false);
  useEffect(()=>{async function load(){const {data,error}=await supabase.from('journal_entries').select('title,body,mood,is_shared_with_partner').eq('id',id).single(); if(error||!data){Alert.alert('Entry unavailable',error?.message??'This entry could not be found.');router.back();return;} setTitle(data.title??'');setBody(data.body);setMood(data.mood);setShared(data.is_shared_with_partner);setLoading(false);} if(id)load();},[id]);

  async function save(){
    if(!session || !id || !body.trim()){Alert.alert('Write a little more','The journal entry cannot be empty.');return;}
    setSaving(true);
    const payload = {
      p_entry_id: id,
      p_client_mutation_id: randomUuid(),
      p_title: title.trim(),
      p_body: body.trim(),
      p_mood: mood,
      p_is_shared_with_partner: shared,
    };
    const {error}=await supabase.rpc('update_journal_entry_idempotent', payload);
    setSaving(false);
    if(error){
      if (isTransientError(error)) {
        await enqueueMutation(session.user.id, 'journal_edit', payload);
        Alert.alert('Saved on this phone','Janani will update this memory safely when the connection returns.');
        router.replace('/journal');
      } else {
        Alert.alert('Could not update entry', error.message);
      }
    } else router.replace('/journal');
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={colors.rose}/></View>;
  return <SafeAreaView style={styles.page}><View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.icon}><Ionicons name="close" size={22} color={colors.ink}/></Pressable><View><Text style={styles.eyebrow}>EDIT MEMORY</Text><Text style={styles.heading}>Your words, your choice</Text></View></View><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.label}>How did you feel?</Text><View style={styles.moods}>{moods.map(item=><Pressable key={item.v} onPress={()=>setMood(item.v)} style={[styles.mood,mood===item.v&&styles.moodActive]}><Text style={styles.emoji}>{item.e}</Text></Pressable>)}</View><Field label="Title" value={title} onChangeText={setTitle}/><Field label="Entry" value={body} onChangeText={setBody} multiline/><View style={styles.share}><View style={{flex:1}}><Text style={styles.shareTitle}>Share with partner</Text><Text style={styles.shareText}>Turn this off to make the entry private again.</Text></View><Switch value={shared} onValueChange={setShared}/></View><Pressable disabled={saving} onPress={save} style={styles.save}>{saving?<ActivityIndicator color={colors.surface}/>:<Text style={styles.saveText}>Save changes</Text>}</Pressable></ScrollView></SafeAreaView>;
}
function Field({label,...props}:{label:string}&React.ComponentProps<typeof TextInput>){return <View><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.muted} style={[styles.input,props.multiline&&styles.multiline]}/></View>}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:colors.background},header:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg},icon:{width:44,height:44,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},eyebrow:{fontSize:11,letterSpacing:1.8,fontWeight:'800',color:colors.rose},heading:{fontSize:25,fontWeight:'800',color:colors.ink},content:{padding:spacing.lg,gap:spacing.lg},label:{marginBottom:spacing.sm,fontSize:13,fontWeight:'800',color:colors.roseDark},moods:{flexDirection:'row',justifyContent:'space-between'},mood:{width:52,height:52,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},moodActive:{backgroundColor:colors.blush,borderColor:colors.rose},emoji:{fontSize:26},input:{minHeight:54,paddingHorizontal:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,fontSize:16,color:colors.ink},multiline:{minHeight:180,paddingTop:spacing.md,textAlignVertical:'top'},share:{flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.md,borderRadius:radius.md,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},shareTitle:{fontWeight:'800',color:colors.ink},shareText:{marginTop:4,fontSize:13,lineHeight:18,color:colors.muted},save:{minHeight:56,borderRadius:radius.pill,alignItems:'center',justifyContent:'center',backgroundColor:colors.rose},saveText:{fontSize:16,fontWeight:'800',color:colors.surface}});
