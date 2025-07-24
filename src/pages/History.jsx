import '../css/History.css';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

const History = () => {
  const { workouts, removeWorkout } = useWorkout();
  const navigate = useNavigate();

  const sortedWorkouts = useMemo(() => {
    return [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [workouts]);

  const viewWorkout = (date) => {
    navigate(`/workout-summary/${date}`);
  };

  const handleDeleteWorkout = (dateToDelete) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      removeWorkout(dateToDelete)
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