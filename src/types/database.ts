// Generated from the connected Supabase project. Nullable RPC parameters are
// widened below because PostgreSQL accepts NULL even though the type generator
// does not currently preserve that part of function contracts.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          last_error: string | null
          requested_at: string
          status: string
          storage_objects: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          last_error?: string | null
          requested_at?: string
          status?: string
          storage_objects?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          last_error?: string | null
          requested_at?: string
          status?: string
          storage_objects?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_push_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          expo_push_token: string
          id: string
          is_active: boolean
          last_seen_at: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          expo_push_token: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          expo_push_token?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "families_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          joined_at: string
          role: Database["public"]["Enums"]["janani_role"]
          user_id: string
        }
        Insert: {
          family_id: string
          joined_at?: string
          role: Database["public"]["Enums"]["janani_role"]
          user_id: string
        }
        Update: {
          family_id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["janani_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          author_id: string
          body: string
          client_mutation_id: string | null
          created_at: string
          entry_date: string
          id: string
          is_shared_with_partner: boolean
          last_edit_mutation_id: string | null
          mood: number | null
          photo_paths: string[]
          pregnancy_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          client_mutation_id?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_shared_with_partner?: boolean
          last_edit_mutation_id?: string | null
          mood?: number | null
          photo_paths?: string[]
          pregnancy_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          client_mutation_id?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          is_shared_with_partner?: boolean
          last_edit_mutation_id?: string | null
          mood?: number | null
          photo_paths?: string[]
          pregnancy_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_nudges: {
        Row: {
          acknowledged_at: string | null
          client_mutation_id: string | null
          created_at: string
          family_id: string
          id: string
          message: string
          push_dispatched_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          client_mutation_id?: string | null
          created_at?: string
          family_id: string
          id?: string
          message?: string
          push_dispatched_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          acknowledged_at?: string | null
          client_mutation_id?: string | null
          created_at?: string
          family_id?: string
          id?: string
          message?: string
          push_dispatched_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_nudges_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_nudges_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_nudges_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pregnancies: {
        Row: {
          created_at: string
          due_date: string
          family_id: string
          height_cm: number | null
          id: string
          last_menstrual_period: string | null
          mother_id: string
          pre_pregnancy_weight_kg: number | null
          status: Database["public"]["Enums"]["pregnancy_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          family_id: string
          height_cm?: number | null
          id?: string
          last_menstrual_period?: string | null
          mother_id: string
          pre_pregnancy_weight_kg?: number | null
          status?: Database["public"]["Enums"]["pregnancy_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          family_id?: string
          height_cm?: number | null
          id?: string
          last_menstrual_period?: string | null
          mother_id?: string
          pre_pregnancy_weight_kg?: number | null
          status?: Database["public"]["Enums"]["pregnancy_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pregnancies_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pregnancies_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_logs: {
        Row: {
          acted_at: string | null
          acted_by: string | null
          created_at: string
          id: string
          note: string | null
          reminder_id: string
          scheduled_for: string
          state: Database["public"]["Enums"]["reminder_state"]
        }
        Insert: {
          acted_at?: string | null
          acted_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reminder_id: string
          scheduled_for: string
          state?: Database["public"]["Enums"]["reminder_state"]
        }
        Update: {
          acted_at?: string | null
          acted_by?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reminder_id?: string
          scheduled_for?: string
          state?: Database["public"]["Enums"]["reminder_state"]
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_acted_by_fkey"
            columns: ["acted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          client_mutation_id: string | null
          created_at: string
          created_by: string
          days_of_week: number[]
          end_date: string | null
          id: string
          instructions: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["reminder_kind"]
          local_time: string
          notification_identifier: string | null
          pregnancy_id: string
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          client_mutation_id?: string | null
          created_at?: string
          created_by: string
          days_of_week?: number[]
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["reminder_kind"]
          local_time: string
          notification_identifier?: string | null
          pregnancy_id: string
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          client_mutation_id?: string | null
          created_at?: string
          created_by?: string
          days_of_week?: number[]
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["reminder_kind"]
          local_time?: string
          notification_identifier?: string | null
          pregnancy_id?: string
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_pregnancy_id_fkey"
            columns: ["pregnancy_id"]
            isOneToOne: false
            referencedRelation: "pregnancies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      acknowledge_partner_nudge: {
        Args: { p_nudge_id: string }
        Returns: undefined
      }
      create_mother_family: {
        Args: {
          p_due_date: string
          p_family_name: string
          p_full_name: string
          p_height_cm?: number | null
          p_last_menstrual_period?: string | null
          p_pre_pregnancy_weight_kg?: number | null
        }
        Returns: {
          family_id: string
          invite_code: string
          pregnancy_id: string
        }[]
      }
      create_reminder_idempotent: {
        Args: {
          p_client_mutation_id: string
          p_days_of_week: number[]
          p_end_date: string | null
          p_instructions: string | null
          p_kind: Database["public"]["Enums"]["reminder_kind"]
          p_local_time: string
          p_pregnancy_id: string
          p_start_date: string
          p_title: string
        }
        Returns: string
      }
      disconnect_partner: { Args: never; Returns: undefined }
      get_mother_family_invite_code: { Args: never; Returns: string }
      get_mother_pregnancy_private_details: {
        Args: never
        Returns: {
          height_cm: number | null
          last_menstrual_period: string | null
          pre_pregnancy_weight_kg: number | null
          pregnancy_id: string
        }[]
      }
      join_family_as_partner: {
        Args: { p_full_name: string; p_invite_code: string }
        Returns: {
          family_id: string
          pregnancy_id: string
        }[]
      }
      leave_family: { Args: never; Returns: undefined }
      list_own_storage_objects_for_account_deletion: {
        Args: { p_limit?: number }
        Returns: {
          bucket_id: string
          object_name: string
        }[]
      }
      mark_reminder_occurrence: {
        Args: {
          p_note?: string | null
          p_reminder_id: string
          p_scheduled_for: string
          p_state: Database["public"]["Enums"]["reminder_state"]
        }
        Returns: {
          acted_at: string | null
          acted_by: string | null
          created_at: string
          id: string
          note: string | null
          reminder_id: string
          scheduled_for: string
          state: Database["public"]["Enums"]["reminder_state"]
        }
        SetofOptions: {
          from: "*"
          to: "reminder_logs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_device_push_token: {
        Args: {
          p_device_name?: string | null
          p_expo_push_token: string
          p_platform: string
        }
        Returns: string
      }
      save_journal_entry_idempotent: {
        Args: {
          p_body: string
          p_client_mutation_id: string
          p_entry_date: string
          p_is_shared_with_partner: boolean
          p_mood: number | null
          p_pregnancy_id: string
          p_title: string | null
        }
        Returns: {
          author_id: string
          body: string
          client_mutation_id: string | null
          created_at: string
          entry_date: string
          id: string
          is_shared_with_partner: boolean
          last_edit_mutation_id: string | null
          mood: number | null
          photo_paths: string[]
          pregnancy_id: string
          title: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "journal_entries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      send_partner_nudge:
        | {
            Args: { p_message?: string }
            Returns: {
              acknowledged_at: string | null
              client_mutation_id: string | null
              created_at: string
              family_id: string
              id: string
              message: string
              push_dispatched_at: string | null
              recipient_id: string
              sender_id: string
            }
            SetofOptions: {
              from: "*"
              to: "partner_nudges"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_client_mutation_id: string; p_message: string }
            Returns: {
              acknowledged_at: string | null
              client_mutation_id: string | null
              created_at: string
              family_id: string
              id: string
              message: string
              push_dispatched_at: string | null
              recipient_id: string
              sender_id: string
            }
            SetofOptions: {
              from: "*"
              to: "partner_nudges"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      unregister_device_push_token: {
        Args: { p_expo_push_token: string }
        Returns: undefined
      }
      update_journal_entry_idempotent: {
        Args: {
          p_body: string
          p_client_mutation_id: string
          p_entry_id: string
          p_is_shared_with_partner: boolean
          p_mood: number | null
          p_title: string | null
        }
        Returns: string
      }
      update_reminder_offline_safe: {
        Args: {
          p_instructions: string | null
          p_local_time: string
          p_reminder_id: string
          p_title: string
        }
        Returns: string
      }
    }
    Enums: {
      janani_role: "mother" | "partner" | "caregiver"
      pregnancy_status: "active" | "completed" | "paused"
      reminder_kind:
        | "medication"
        | "appointment"
        | "hydration"
        | "nutrition"
        | "custom"
      reminder_state: "pending" | "taken" | "skipped" | "missed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      janani_role: ["mother", "partner", "caregiver"],
      pregnancy_status: ["active", "completed", "paused"],
      reminder_kind: [
        "medication",
        "appointment",
        "hydration",
        "nutrition",
        "custom",
      ],
      reminder_state: ["pending", "taken", "skipped", "missed"],
    },
  },
} as const
