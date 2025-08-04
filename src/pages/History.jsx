import '../css/History.css';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { deleteWorkout, fetchWorkouts } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';
import { handleSupabaseAuthError } from '../utils/authErrorHandler';

const History = () => {
  const { workouts, setWorkouts } = useWorkout();
  const { userId, logout } = useAuthentication();
  const navigate = useNavigate();

  const viewWorkout = (workout) => {
    navigate(`/workout-summary`, { state: { workout: workout } });
  };

  const handleDeleteWorkout = async (workoutId) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      try {
        await deleteWorkout(userId, workoutId);
        const workouts = await fetchWorkouts(userId);
        setWorkouts(workouts);
      } catch (error) {
        handleSupabaseAuthError(err, logout);
        console.error("Failed to delete workout:", error.message);
      }
    }
  };

  return (
    <div>
      <h1 className='page-title'>📅 History</h1>
      {workouts.length === 0 ? (
        <p>No workouts logged yet.</p>
      ) : (
        workouts.map((workout) => (
          <div key={workout.id} className="workout-summary-card">
            <h3>{workout.type} — {new Date(workout.date).toLocaleDateString()}</h3>
            <p>{workout.exercises.length} exercises</p>
            <div className="workout-actions">
              <button onClick={() => viewWorkout(workout)}>View Details</button>
              <button onClick={() => handleDeleteWorkout(workout.id)} className="delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History;