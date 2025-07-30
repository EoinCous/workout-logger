import '../css/History.css';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { deleteWorkout } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';

const History = () => {
  const { workouts, removeWorkout } = useWorkout();
  const { user } = useAuthentication();
  const navigate = useNavigate();

  const sortedWorkouts = useMemo(() => {
    return [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workouts]);

  const viewWorkout = (date) => {
    navigate(`/workout-summary/${date}`);
  };

  const handleDeleteWorkout = async (dateToDelete) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      removeWorkout(dateToDelete)
      try {
        // pass the id that is generated in supabase into delete workout
        await deleteWorkout(user.id);
        console.log("Workout deleted successfully");
      } catch (error) {
        console.error("Failed to insert workout:", error.message);
      }
    }
  };

  return (
    <div>
      <h1 className='page-title'>📅 History</h1>
      {workouts.length === 0 ? (
        <p>No workouts logged yet.</p>
      ) : (
        sortedWorkouts.map((workout) => (
          <div key={workout.date} className="workout-summary-card">
            <h3>{workout.type} — {new Date(workout.date).toLocaleDateString()}</h3>
            <p>{workout.exercises.length} exercises</p>
            <div className="workout-actions">
              <button onClick={() => viewWorkout(workout.date)}>View Details</button>
              <button onClick={() => handleDeleteWorkout(workout.date)} className="delete-btn">
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