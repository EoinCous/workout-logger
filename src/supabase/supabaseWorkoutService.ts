import type { Database } from './supabaseClient';
import { supabase } from './supabaseClient';

type WorkoutSet = {
  reps?: string | number;
  weight?: string | number;
  seconds?: number;
};

type ExerciseInput = {
  id: string;
  sets?: WorkoutSet[];
};

type WorkoutInput = {
  date: string;
  type: string;
  exercises: ExerciseInput[];
  personalBests?: Database['public']['Tables']['workouts']['Insert']['personal_bests'];
  completedAt?: string | null;
  notes?: string | null;
};

type CurrentPlanInput = {
  date: string;
  type: string;
  exercises: ExerciseInput[];
};

type TemplateInput = {
  name: string;
  type: string;
  exercises: ExerciseInput[];
};

type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
type WorkoutResult = Omit<WorkoutRow, 'user_id' | 'personal_bests' | 'completed_at'> & {
  personalBests: WorkoutRow['personal_bests'];
  completedAt: WorkoutRow['completed_at'];
};

const formatExercises = (exercises: ExerciseInput[]) =>
  exercises.map(({ id, sets }) => ({ id, sets }));

export const fetchWorkouts = async (userId: string): Promise<WorkoutResult[]> => {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, date, type, exercises, personal_bests, completed_at, notes')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((workout) => ({
    id: workout.id,
    date: workout.date,
    type: workout.type,
    exercises: workout.exercises,
    personalBests: workout.personal_bests,
    completedAt: workout.completed_at,
    notes: workout.notes,
  }));
};

export const insertWorkout = async (userId: string, workout: WorkoutInput) => {
  const cleanedExercises = formatExercises(workout.exercises);

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      date: workout.date,
      type: workout.type,
      exercises: cleanedExercises,
      personal_bests: workout.personalBests,
      completed_at: workout.completedAt,
      notes: workout.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWorkout = async (userId: string, id: string): Promise<void> => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
};

export const fetchCurrentPlan = async (userId: string) => {
  const { data, error } = await supabase
    .from('current_plan')
    .select('date, exercises, type')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertCurrentPlan = async (userId: string, currentPlan: CurrentPlanInput) => {
  const cleanedExercises = formatExercises(currentPlan.exercises);

  const { data, error } = await supabase
    .from('current_plan')
    .upsert(
      {
        user_id: userId,
        date: currentPlan.date,
        exercises: cleanedExercises,
        type: currentPlan.type,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const clearCurrentPlan = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('current_plan')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};

export const fetchWeeklyGoal = async (userId: string): Promise<number | undefined> => {
  const { data, error } = await supabase
    .from('weekly_goal')
    .select('weekly_goal')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.weekly_goal;
};

export const upsertWeeklyGoal = async (userId: string, goal: number) => {
  const { data, error } = await supabase
    .from('weekly_goal')
    .upsert(
      { user_id: userId, weekly_goal: goal },
      { onConflict: 'user_id' },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchTemplates = async (userId: string) => {
  const { data, error } = await supabase
    .from('templates')
    .select('id, name, exercises, type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const insertTemplate = async (userId: string, template: TemplateInput) => {
  const { count, error: countError } = await supabase
    .from('templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) throw countError;

  if (count !== null && count >= 5) {
    throw Object.assign(new Error('Template limit reached'), { code: 'LIMIT_REACHED' });
  }

  const cleanedExercises = formatExercises(template.exercises);

  const { data, error } = await supabase
    .from('templates')
    .insert({
      user_id: userId,
      name: template.name,
      exercises: cleanedExercises,
      type: template.type,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTemplate = async (userId: string, templateId: string): Promise<void> => {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('user_id', userId)
    .eq('id', templateId);

  if (error) throw error;
};
