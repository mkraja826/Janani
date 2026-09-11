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

    const resolvedUserId = userId;
    setLoading(true);

    async function loadRole() {
      try {
        const { data } = await supabase
          .from('family_members')
          .select('role')
          .eq('user_id', resolvedUserId)
          .maybeSingle();
        if (!active) return;
        setRole(data?.role === 'partner' ? 'partner' : data?.role === 'mother' ? 'mother' : null);
      } catch {
        if (!active) return;
        setRole(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRole();
    return () => { active = false; };
  }, [userId]);

  return { role, loading, isPartner: role === 'partner', isMother: role === 'mother' };
}
