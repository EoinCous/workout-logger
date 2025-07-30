import { supabase } from './supabaseClient';

export const fetchWorkouts = async (userId) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, date, type, exercises, personal_bests, completed_at')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data;
};

export const insertWorkout = async (userId, workout) => {
  const cleanedExercises = workout.exercises.map(exercise => ({ id: exercise.id, sets: exercise.sets }));

  const { data, error } = await supabase
    .from('workouts')
    .insert({ 
      user_id: userId,
      date: workout.date,
      type: workout.type,
      exercises: cleanedExercises,
      personal_bests: workout.personalBests,
      completed_at: workout.completedAt 
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteWorkout = async (userId, id) => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);

  if (error) throw error;
};

export const fetchCurrentPlan = async (userId) => {
  const { data } = await supabase
    .from('current_plan')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // automatically returns null instead of error if no row

  if (error) throw error;
  return data;
};

export const upsertCurrentPlan = async (userId) => {
  const { data, error } = await supabase
    .from('current_plan')
    .upsert({ data: {...plan}, userId }, { onConflict: ['user_id'] })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchWeeklyGoal = async (userId) => {
  const { data, error } = await supabase
    .from('weekly_goal')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle(); // automatically returns null instead of error if no row

  if (error) throw error;
  return data;
};

export const upsertWeeklyGoal = async (userId, goal) => {
  const { data, error } = await supabase
    .from('weekly_goal')
    .upsert({ data: {...goal}, userId }, { onConflict: ['user_id'] })
    .select()
    .single();

  if (error) throw error;
  return data;
};