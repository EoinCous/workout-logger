import '../css/WeeklyProgress.css';
import { useState } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { format, isThisWeek, parseISO } from 'date-fns';
import { upsertWeeklyGoal } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';

const WeeklyProgress = () => {
  const { workouts, setWeeklyGoal, weeklyGoal } = useWorkout();
  const [newGoal, setNewGoal] = useState(weeklyGoal || "");
  const { user } = useAuthentication();

  const weeklyWorkouts = workouts.filter(workout =>
    isThisWeek(parseISO(workout.date), { weekStartsOn: 1 })
  );

  const totalVolume = weeklyWorkouts.reduce((total, workout) => {
    return total + workout.exercises.reduce((exTotal, ex) => {
      return exTotal + ex.sets.reduce((setTotal, set) => {
        return setTotal + set.reps * set.weight;
      }, 0);
    }, 0);
  }, 0);

  const allSets = weeklyWorkouts.flatMap(workout =>
    workout.exercises.flatMap(ex => ex.sets)
  );

  const totalSets = allSets.length;
  const totalReps = allSets.reduce((sum, set) => sum + Number(set.reps), 0);

  const updateGoal = async () => {
    if (newGoal === weeklyGoal) return;

    try {
      await upsertWeeklyGoal(user?.id, newGoal);
      setWeeklyGoal(newGoal);
    } catch (e) {
      console.error("Failed to upsert weekly goal:", e);
    }
  }

  return (
    <div className="weekly-progress-page">
      <h1 className='page-title'>📈 Weekly Progress</h1>

      <div className="weekly-summary-card">
        <h2>Summary</h2>
        <p>Workouts Completed: {weeklyWorkouts.length}</p>
        <p>Total Volume: {totalVolume} kg</p>
        <p>Sets Logged: {totalSets}</p>
        <p>Total Reps: {totalReps}</p>
      </div>

      <div className="weekly-goal-section">
        <h3>🎯 Weekly Workout Goal</h3>
        <p>{weeklyWorkouts.length} / {weeklyGoal || "?"}</p>
        <progress max={weeklyGoal || 1} value={weeklyWorkouts.length}></progress>

        <div className="goal-input">
          <input
            type="number"
            placeholder="Set new goal"
            value={newGoal}
            max={7}
            onChange={(e) => setNewGoal(Number(e.target.value))}
          />
          <button onClick={updateGoal}>Update Goal</button>
        </div>
      </div>

      <div className="workout-breakdown">
        <h3>🗓️ Workouts This Week</h3>
        {weeklyWorkouts.length === 0 ? (
          <p>No workouts logged yet this week.</p>
        ) : (
          <ul>
            {weeklyWorkouts.map((workout, i) => (
              <li key={i}>
                {workout.type} on {format(parseISO(workout.date), 'EEEE')}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WeeklyProgress;