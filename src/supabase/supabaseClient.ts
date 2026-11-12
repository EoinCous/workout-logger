import { createClient } from '@supabase/supabase-js';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

type JsonObject = { [key: string]: Json | undefined };

type WorkoutSet = JsonObject & {
  reps?: string | number;
  weight?: string | number;
  seconds?: number;
};

type WorkoutExercise = JsonObject & {
  id: string;
  sets?: WorkoutSet[];
};

export type Database = {
  public: {
    Tables: {
      current_plan: {
        Row: {
          user_id: string;
          date: string;
          exercises: WorkoutExercise[];
          type: string;
        };
        Insert: {
          user_id: string;
          date: string;
          exercises: WorkoutExercise[];
          type: string;
        };
        Update: {
          user_id?: string;
          date?: string;
          exercises?: WorkoutExercise[];
          type?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          exercises: WorkoutExercise[];
          type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          exercises: WorkoutExercise[];
          type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          exercises?: WorkoutExercise[];
          type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      weekly_goal: {
        Row: {
          user_id: string;
          weekly_goal: number;
        };
        Insert: {
          user_id: string;
          weekly_goal: number;
        };
        Update: {
          user_id?: string;
          weekly_goal?: number;
        };
        Relationships: [];
      };
      body_weights: {
        Row: {
          user_id: string;
          recorded_date: string;
          weight: number;
        };
        Insert: {
          user_id: string;
          recorded_date: string;
          weight: number;
        };
        Update: {
          user_id?: string;
          recorded_date?: string;
          weight?: number;
        };
        Relationships: [];
      };
      personal_bests: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          tracking_type: string;
          name: string;
          muscle: string;
          weight: number | null;
          reps: number | null;
          seconds: number | null;
          achieved_in_workout_id: string | null;
          achieved_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          exercise_id: string;
          tracking_type: string;
          name: string;
          muscle: string;
          weight?: number | null;
          reps?: number | null;
          seconds?: number | null;
          achieved_in_workout_id?: string | null;
          achieved_at: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          tracking_type?: string;
          name?: string;
          muscle?: string;
          weight?: number | null;
          reps?: number | null;
          seconds?: number | null;
          achieved_in_workout_id?: string | null;
          achieved_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          type: string;
          exercises: WorkoutExercise[];
          personal_bests: JsonObject | null;
          completed_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          type: string;
          exercises: WorkoutExercise[];
          personal_bests?: JsonObject | null;
          completed_at?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          type?: string;
          exercises?: WorkoutExercise[];
          personal_bests?: JsonObject | null;
          completed_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE;

export const supabase = createClient<Database>(supabaseUrl, supabasePublishable, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
