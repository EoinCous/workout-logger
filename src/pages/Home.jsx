import '../css/Home.css'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from "../context/WorkoutContext";
import { isThisWeek, parseISO, isToday } from 'date-fns';

const Home = () => {
  const { status, workouts, getLastWorkout, weeklyGoal } = useWorkout();

  const lastWorkout = getLastWorkout();

  const workoutDuration = () => {
    const durationMs = new Date(lastWorkout.completedAt) - new Date(lastWorkout.date);
    return Math.round(durationMs / 1000 / 60);
  }

  const weeklyWorkouts = workouts.filter(workout => 
      isThisWeek(parseISO(workout.date), { weekStartsOn: 1 })
  );

  const navigate = useNavigate()

  return (
    <div className="home">
      <h1 className='page-title'>RepLog</h1>

      <div className="home-section" onClick={() => navigate('/workout')}>
        <h2>🏋️ Today's Workout</h2>
        {status === "idle" && (
          <div>
            <p>Plan today's workout.</p>
          </div>
        )}

        {status === "planning" && (
          <div>
            <p>Contiune planning today's workout.</p>
          </div>
        )}

        {status === "planned" && (
          <div>
            <p>Start today's workout.</p>
          </div>
        )}

        {status === "inProgress" && (
          <div>
            <p>Your workout is in progress.</p>
          </div>
        )}

        {status === "complete" && lastWorkout && isToday(parseISO(lastWorkout.date)) ? (
          <div>
            <p>You've completed today's workout! 🎉</p>
          </div>
        ) : status === "complete" ? (
          <div>
            <p>Plan today's workout.</p>
          </div>
        ) : null}
      </div>

      <div className="home-section" onClick={() => navigate('/history')}>
        <h2>📅 Most Recent Workout</h2>
        {lastWorkout ? (
          <p>{lastWorkout.type.toUpperCase()} • {workoutDuration()} mins • {new Date(lastWorkout.date).toLocaleString()}</p>
        ) : (
          <p>No workouts yet. Start planning your first session!</p>
        )}
      </div>

      <div className="home-section" onClick={() => navigate('/personal-bests')}>
        <h2>🏆 Personal Bests</h2>
        <p>Your all-time best lifts</p>
      </div>

      <div className="home-section" onClick={() => navigate('/weekly-progress')}>
        <h2>📈 Weekly Stats</h2>
        {weeklyGoal ? (
          <div>
          <p>Workouts Completed: {weeklyWorkouts.length} / {weeklyGoal.weeklyGoal}</p>  
          <progress max={weeklyGoal} value={weeklyWorkouts.length}></progress>
        </div>
        ) : (
          <p>Set your weekly goal</p>
        )}
      </div>

      <div className="home-section" onClick={() => navigate('/suggestions')}>
        <h2>💡 Got suggestions?</h2>
        <p>Enter an improvement that could be made to Workout Logger</p>
      </div>
    </div>
  )
}

export default Home