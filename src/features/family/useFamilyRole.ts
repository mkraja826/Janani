import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

export type FamilyRole = 'mother' | 'partner';

export function useFamilyRole() {
  const { session } = useAuth();
  const [role, setRole] = useState<FamilyRole | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = session?.user.id;

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRole(null);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    void supabase
      .from('family_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setRole(data?.role === 'partner' ? 'partner' : data?.role === 'mother' ? 'mother' : null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setRole(null);
        setLoading(false);
      });

    return () => { active = false; };
  }, [userId]);

  return { role, loading, isPartner: role === 'partner', isMother: role === 'mother' };
}
