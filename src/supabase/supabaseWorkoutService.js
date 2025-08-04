import { supabase } from './supabaseClient';

export const fetchWorkouts = async (userId) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('id, date, type, exercises, personal_bests, completed_at')
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
  }));
};

export const insertWorkout = async (userId, workout) => {
  const cleanedExercises = formatExercises(workout.exercises);

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
  const { data, error } = await supabase
    .from('current_plan')
    .select('date, exercises, type')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const upsertCurrentPlan = async (userId, currentPlan) => {
  const cleanedExercises = formatExercises(currentPlan.exercises);

  const { data, error } = await supabase
    .from('current_plan')
    .upsert(
      { user_id: userId,
        date: currentPlan.date,
        exercises: cleanedExercises,
        type: currentPlan.type }, 
      { onConflict: ['user_id'] }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const clearCurrentPlan = async (userId) => {
  const { error } = await supabase
      .from('current_plan')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
}

export const fetchWeeklyGoal = async (userId) => {
  const { data, error } = await supabase
    .from('weekly_goal')
    .select('weekly_goal')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  const weeklyGoal = { weeklyGoal: data?.weekly_goal }
  return weeklyGoal.weeklyGoal;
};

export const upsertWeeklyGoal = async (userId, goal) => {
  const { data, error } = await supabase
    .from('weekly_goal')
    .upsert(
      { user_id: userId, weekly_goal: goal }, 
      { onConflict: ['user_id'] }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

const formatExercises = (exercises) => {
  return exercises.map(exercise => ({ id: exercise.id, sets: exercise.sets }));
}