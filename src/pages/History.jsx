import '../css/History.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const [workouts, setWorkouts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('workouts')) || [];
    const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
    setWorkouts(sorted);
  }, []);

  const viewWorkout = (date) => {
    navigate(`/workout-summary/${date}`);
  };

  const handleDeleteWorkout = (dateToDelete) => {
    if (!window.confirm("Are you sure you want to delete this workout?")) return;

    const updatedWorkouts = workouts.filter(workout => workout.date !== dateToDelete);
    localStorage.setItem('workouts', JSON.stringify(updatedWorkouts));
    setWorkouts(updatedWorkouts);
  };

  return (
    <div>
      <h1>Workout History</h1>
      {workouts.length === 0 ? (
        <p>No workouts logged yet.</p>
      ) : (
        workouts.map((workout) => (
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