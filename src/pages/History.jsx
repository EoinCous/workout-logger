import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'

const History = () => {
  const [workouts, setWorkouts] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('workouts')) || [];
    // Sort by date descending
    const sorted = saved.sort((a, b) => new Date(b.date) - new Date(a.date));
    setWorkouts(sorted);
  }, []);

  const viewWorkout = (date) => {
    navigate(`/workout-summary/${date}`)
  }

  return (
    <div>
      <h1>Workout History</h1>
      {workouts.map((workout) => (
        <div key={workout.date} className="workout-summary-card">
          <h3>{workout.type} — {new Date(workout.date).toLocaleDateString()}</h3>
          <p>{workout.exercises.length} exercises</p>
          <button onClick={() => viewWorkout(workout.date)}>View Details</button>
        </div>
      ))}
    </div>
  );
};

export default History;