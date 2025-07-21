import '../css/Home.css'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from "../context/WorkoutContext";
import { isThisWeek, parseISO, isToday } from 'date-fns';

const Home = () => {
  const { status, workouts, getLastWorkout } = useWorkout();

  const lastWorkout = getLastWorkout();
  const durationMs = new Date(lastWorkout.completedAt) - new Date(lastWorkout.date);
  const durationMins = Math.round(durationMs / 1000 / 60);

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

  const navigate = useNavigate()

  const handleStartWorkout = () => navigate('/workout')
  const handleViewHistory = () => navigate('/history')
  const handleViewPBs = () => navigate('/personal-bests')
  const handleSuggestions = () => navigate('/suggestions')

  return (
    <div className="home">
      <h1>RepLog</h1>

      <div className="home-section" onClick={handleStartWorkout}>
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

      <div className="home-section" onClick={handleViewHistory}>
        <h2>📅 Most Recent Workout</h2>
        {lastWorkout ? (
          <p>{lastWorkout.type.toUpperCase()} • {durationMins} mins • {new Date(lastWorkout.date).toLocaleString()}</p>
        ) : (
          <p>No workouts yet. Start planning your first session!</p>
        )}
      </div>

      <div className="home-section" onClick={handleViewPBs}>
        <h2>🏆 Personal Bests</h2>
        <p>Your all-time best lifts</p>
      </div>

      <div className="home-section">
        <h2>📈 Weekly Stats</h2>
        {weeklyWorkouts.length === 0 ? (
          <p>No workouts logged this week. Let's get moving! 💪</p>
        ) : (
          <>
            <p>Workouts Completed: {weeklyWorkouts.length}</p>
            <p>Total Volume: {totalVolume} kg</p>
            <p>Sets Logged: {totalSets}</p>
            <p>Total Reps: {totalReps}</p>
          </>
        )}
      </div>

      <div className="home-section" onClick={handleSuggestions}>
        <h2>💡 Got suggestions?</h2>
        <p>Enter an improvement that could be made to Workout Logger</p>
      </div>
    </div>
  )
}

export default Home