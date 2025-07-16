import '../css/Home.css'
import { useNavigate } from 'react-router-dom'
import { useWorkout } from "../context/WorkoutContext";

const Home = () => {
  const { status, getLastWorkout } = useWorkout();
  const lastWorkout = getLastWorkout();

  const navigate = useNavigate()

  const handleStartWorkout = () => navigate('/workout')
  const handleViewHistory = () => navigate('/history')
  const handleViewPBs = () => navigate('/personal-bests')
  const handleSuggestions = () => navigate('/suggestions')

  return (
    <div className="home">
      <h1>Welcome Back</h1>

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

        {status === "complete" && (
          <div>
            <p>You've completed today's workout! 🎉</p>
          </div>
        )}
      </div>

      <div className="home-section" onClick={handleViewHistory}>
        <h2>📅 Most Recent Workout</h2>
        {lastWorkout ? (
          <p>{lastWorkout.type.toUpperCase()} • 60 mins • {new Date(lastWorkout.date).toLocaleString()}</p>
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
        <p>3 Workouts • Total Volume: 24,300 kg</p>
      </div>

      <div className="home-section" onClick={handleSuggestions}>
        <h2>💡 Got suggestions?</h2>
        <p>Enter an improvement that could be made to Workout Logger</p>
      </div>
    </div>
  )
}

export default Home