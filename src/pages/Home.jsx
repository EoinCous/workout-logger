import { useNavigate } from 'react-router-dom'
import '../css/Home.css'
import { useWorkout } from "../context/WorkoutContext";

const Home = () => {
  const { getLastWorkout } = useWorkout();
  const lastWorkout = getLastWorkout();

  const navigate = useNavigate()

  const handleStartWorkout = () => navigate('/workout')
  const handleViewHistory = () => navigate('/history')
  const handleViewPBs = () => navigate('/personal-bests')

  return (
    <div className="home">
      <h1>Welcome Back</h1>

      <div className="home-section" onClick={handleStartWorkout}>
        <h2>🏋️ Today's Workout</h2>
        <p>Start, plan or continue your current session</p>
      </div>

      <div className="home-section" onClick={handleViewHistory}>
        <h2>📅 Most Recent Workout</h2>
        {lastWorkout ? (
          <p>{lastWorkout.type} • 60 mins • {lastWorkout.date}</p>
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
    </div>
  )
}

export default Home