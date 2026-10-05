/**
 * Hand-written strict types for the public schema defined in
 * `supabase/migrations/0001_init.sql`.
 *
 * These mirror the SQL columns, nullability, and defaults exactly so that
 * `SupabaseClient<Database>` gives fully-typed, `any`-free query results. The
 * shape matches what the Supabase CLI generates, so it is a drop-in for the
 * generated file.
 *
 * OPTIONAL regeneration (only if the Supabase CLI is installed; not required
 * to build this app):
 *
 *   supabase gen types typescript --project-id <project-id> > src/data/database.types.ts
 *
 * Until then this file is the source of truth and must be kept in sync with
 * 0001_init.sql by hand.
 */

/** goal_type enum — UNACCENTED ASCII values (UI supplies the accented label). */
export type GoalType = 'deficit' | 'mantenimiento' | 'volumen';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      macro_goals: {
        Row: {
          id: string;
          user_id: string;
          goal_type: GoalType;
          tdee: number;
          calorie_target: number;
          protein_g: number;
          fat_g: number;
          carbs_g: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          goal_type: GoalType;
          tdee: number;
          calorie_target: number;
          protein_g: number;
          fat_g: number;
          carbs_g: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          goal_type?: GoalType;
          tdee?: number;
          calorie_target?: number;
          protein_g?: number;
          fat_g?: number;
          carbs_g?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          logged_on: string;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_kg: number;
          logged_on?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weight_kg?: number;
          logged_on?: string;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      food_logs: {
        Row: {
          id: string;
          user_id: string;
          logged_on: string;
          name: string;
          quantity: number;
          unit: string;
          calories: number;
          protein_g: number;
          fat_g: number;
          carbs_g: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          logged_on?: string;
          name: string;
          quantity: number;
          unit?: string;
          calories: number;
          protein_g?: number;
          fat_g?: number;
          carbs_g?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          logged_on?: string;
          name?: string;
          quantity?: number;
          unit?: string;
          calories?: number;
          protein_g?: number;
          fat_g?: number;
          carbs_g?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_active_macro_goal: {
        Args: {
          p_goal_type: GoalType;
          p_tdee: number;
          p_calorie_target: number;
          p_protein_g: number;
          p_fat_g: number;
          p_carbs_g: number;
        };
        Returns: Database['public']['Tables']['macro_goals']['Row'];
      };
    };
    Enums: {
      goal_type: GoalType;
    };
  };
}
