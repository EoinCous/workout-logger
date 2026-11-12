import type { Database } from './supabaseClient';
import { supabase } from './supabaseClient';
import type { PersonalBest, PersonalBestRecord } from '../utils/pbUtils';

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
  personalBests?: PersonalBestRecord;
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

export type BodyWeightInput = {
  recordedDate: string;
  weight: number;
};

export type BodyWeightResult = BodyWeightInput;

type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
type WorkoutResult = Omit<WorkoutRow, 'user_id' | 'personal_bests' | 'completed_at'> & {
  completedAt: WorkoutRow['completed_at'];
};

type BodyWeightRow = Database['public']['Tables']['body_weights']['Row'];
type PersonalBestRow = Database['public']['Tables']['personal_bests']['Row'];

const formatExercises = (exercises: ExerciseInput[]) =>
  exercises.map(({ id, sets }) => ({ id, sets }));

const formatBodyWeight = (bodyWeight: Pick<BodyWeightRow, 'recorded_date' | 'weight'>): BodyWeightResult => ({
  recordedDate: bodyWeight.recorded_date,
  weight: bodyWeight.weight,
});

const formatPersonalBest = (row: PersonalBestRow): PersonalBest => {
  if (row.tracking_type === 'time' && row.seconds !== null) {
    return {
      exerciseId: row.exercise_id,
      name: row.name,
      muscle: row.muscle,
      trackingType: 'time',
      seconds: row.seconds,
      ...(row.weight !== null && { weight: row.weight }),
      date: row.achieved_at,
      ...(row.achieved_in_workout_id && {
        achievedInWorkoutId: row.achieved_in_workout_id,
      }),
    };
  }

  if (row.tracking_type !== 'time' && row.weight !== null && row.reps !== null) {
    return {
      exerciseId: row.exercise_id,
      name: row.name,
      muscle: row.muscle,
      weight: row.weight,
      reps: row.reps,
      date: row.achieved_at,
      ...(row.achieved_in_workout_id && {
        achievedInWorkoutId: row.achieved_in_workout_id,
      }),
    };
  }

  throw new Error(`Invalid personal best record for exercise "${row.exercise_id}".`);
};

const toPersonalBestRow = (
  userId: string,
  workoutId: string | null,
  personalBest: PersonalBest,
): Database['public']['Tables']['personal_bests']['Insert'] => ({
  user_id: userId,
  exercise_id: personalBest.exerciseId,
  tracking_type: personalBest.trackingType ?? 'reps',
  name: personalBest.name,
  muscle: personalBest.muscle ?? 'Other',
  weight: personalBest.weight ?? null,
  reps: personalBest.reps ?? null,
  seconds: personalBest.seconds ?? null,
  achieved_in_workout_id: workoutId,
  achieved_at: personalBest.date,
});

export const fetchPersonalBests = async (userId: string): Promise<PersonalBestRecord> => {
  const { data, error } = await supabase
    .from('personal_bests')
    .select('id, user_id, exercise_id, tracking_type, name, muscle, weight, reps, seconds, achieved_in_workout_id, achieved_at')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false });

  if (error) throw error;

  return data.reduce<PersonalBestRecord>((personalBests, row) => {
    const formatted = formatPersonalBest(row);
    if (!personalBests[formatted.exerciseId]) {
      personalBests[formatted.exerciseId] = formatted;
    }
    return personalBests;
  }, {});
};

export const fetchWorkouts = async (userId: string): Promise<WorkoutResult[]> => {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, date, type, exercises, completed_at, notes')
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
      completed_at: workout.completedAt,
      notes: workout.notes,
    })
    .select()
    .single();

  if (error) throw error;

  for (const personalBest of Object.values(workout.personalBests ?? {})) {
    const personalBestRow = toPersonalBestRow(userId, data.id, personalBest);
    const { data: updatedRows, error: updateError } = await supabase
      .from('personal_bests')
      .update(personalBestRow)
      .eq('user_id', userId)
      .eq('exercise_id', personalBest.exerciseId)
      .select('id');

    if (updateError) throw updateError;

    if (!updatedRows?.length) {
      const { error: insertError } = await supabase
        .from('personal_bests')
        .insert(personalBestRow);
      if (insertError) throw insertError;
    }
  }

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

export const fetchBodyWeights = async (userId: string): Promise<BodyWeightResult[]> => {
  const { data, error } = await supabase
    .from('body_weights')
    .select('recorded_date, weight')
    .eq('user_id', userId)
    .order('recorded_date', { ascending: false });

  if (error) throw error;
  return data.map(formatBodyWeight);
};

export const upsertBodyWeight = async (
  userId: string,
  bodyWeight: BodyWeightInput,
): Promise<BodyWeightResult> => {
  const { data, error } = await supabase
    .from('body_weights')
    .upsert(
      {
        user_id: userId,
        recorded_date: bodyWeight.recordedDate,
        weight: bodyWeight.weight,
      },
      { onConflict: 'user_id,recorded_date' },
    )
    .select('recorded_date, weight')
    .single();

  if (error) throw error;
  return formatBodyWeight(data);
};

export const deleteBodyWeight = async (userId: string, recordedDate: string): Promise<void> => {
  const { error } = await supabase
    .from('body_weights')
    .delete()
    .eq('user_id', userId)
    .eq('recorded_date', recordedDate);

  if (error) throw error;
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
