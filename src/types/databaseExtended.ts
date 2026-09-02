import type { Database as GeneratedDatabase, Json } from '@/types/database';

type GeneratedPublic = GeneratedDatabase['public'];

/**
 * Small compatibility layer for production RPCs deployed after the last
 * generated Supabase type snapshot. Keep generated database.ts untouched so it
 * can be replaced safely by `supabase gen types` later.
 */
export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedPublic, 'Functions'> & {
    Functions: GeneratedPublic['Functions'] & {
      get_own_care_plus_status: {
        Args: never;
        Returns: Json;
      };
    };
  };
};
