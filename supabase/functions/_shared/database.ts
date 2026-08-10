export type EdgeDatabase = {
  public: {
    Tables: {
      device_push_tokens: {
        Row: {
          expo_push_token: string;
          is_active: boolean;
          last_seen_at: string;
          locale_code: string;
          user_id: string;
        };
        Insert: {
          expo_push_token: string;
          is_active?: boolean;
          last_seen_at?: string;
          locale_code?: string;
          user_id: string;
        };
        Update: {
          expo_push_token?: string;
          is_active?: boolean;
          last_seen_at?: string;
          locale_code?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      partner_nudges: {
        Row: {
          id: string;
          push_dispatched_at: string | null;
          recipient_id: string;
        };
        Insert: {
          id?: string;
          push_dispatched_at?: string | null;
          recipient_id: string;
        };
        Update: {
          push_dispatched_at?: string | null;
        };
        Relationships: [];
      };
      account_deletion_requests: {
        Row: {
          last_error: string | null;
          requested_at: string;
          status: "pending" | "auth_deleted";
          storage_objects: unknown;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          last_error?: string | null;
          requested_at?: string;
          status?: "pending" | "auth_deleted";
          storage_objects?: unknown;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          last_error?: string | null;
          status?: "pending" | "auth_deleted";
          storage_objects?: unknown;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      list_own_storage_objects_for_account_deletion: {
        Args: { p_limit?: number };
        Returns: Array<{
          bucket_id: string;
          object_name: string;
        }>;
      };
      send_partner_nudge: {
        Args: {
          p_client_mutation_id: string;
          p_message: string;
        };
        Returns: {
          id: string;
          recipient_id: string;
        };
      };
    };
  };
};