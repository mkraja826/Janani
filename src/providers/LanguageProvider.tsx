import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  resolveUiLanguage,
  translate,
  type SupportedUiLanguage,
  type TranslationKey,
} from '@/i18n/catalog';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const CACHE_KEY = 'ui-language-v1';

type LanguageContextValue = {
  language: SupportedUiLanguage;
  loading: boolean;
  setLanguage: (language: SupportedUiLanguage) => Promise<{ error: Error | null }>;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [language, setLanguageState] = useState<SupportedUiLanguage>('en');
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      if (!userId) {
        if (active) {
          setLanguageState('en');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const cached = await readCache<string>(userId, CACHE_KEY);
      if (!active) return;
      if (cached) setLanguageState(resolveUiLanguage(cached));

      const result = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .maybeSingle();
      if (!active) return;

      if (!result.error && result.data?.preferred_language) {
        const resolved = resolveUiLanguage(result.data.preferred_language);
        setLanguageState(resolved);
        await writeCache(userId, CACHE_KEY, resolved);
      }
      setLoading(false);
    }

    void loadLanguage();
    return () => {
      active = false;
    };
  }, [userId]);

  const setLanguage = useCallback(async (nextLanguage: SupportedUiLanguage) => {
    const previous = language;
    setLanguageState(nextLanguage);
    if (!userId) return { error: null };

    await writeCache(userId, CACHE_KEY, nextLanguage);
    const result = await supabase
      .from('profiles')
      .update({ preferred_language: nextLanguage })
      .eq('id', userId);

    if (result.error) {
      setLanguageState(previous);
      await writeCache(userId, CACHE_KEY, previous);
      return { error: new Error(result.error.message) };
    }

    return { error: null };
  }, [language, userId]);

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    loading,
    setLanguage,
    t,
  }), [language, loading, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
