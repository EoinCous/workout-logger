import { useParams } from 'react-router-dom';
import { useWorkout } from "../context/WorkoutContext";
import '../css/WorkoutSummary.css';

const WorkoutSummary = () => {
  const { date } = useParams();
  const { workouts } = useWorkout();
  const workout = workouts.find((workout) => workout.date === date);

  if (!workout) {
    return <p className="not-found">Workout not found.</p>;
  }

  const formattedDate = new Date(workout.date).toLocaleString();

  const durationMs = new Date(workout.completedAt) - new Date(workout.date);
    const durationMins = Math.round(durationMs / 1000 / 60);

  return (
    <div className="summary-container">
      <h1 className="workout-title">💪 {workout.type.toUpperCase()} Workout</h1>
      <div className='workout-meta'>
        <p className="workout-date">Completed on: {formattedDate}</p>
        <p className="workout-duration">Duration: {durationMins} minutes</p>
      </div>

      {workout.exercises.map((exercise, index) => (
        <div key={exercise.id} className="exercise-card">
          <h2 className="exercise-title">{index + 1}. {exercise.name}</h2>
          <p className="exercise-meta">{exercise.muscle} • {exercise.equipment}</p>
          <p className="exercise-desc">{exercise.description}</p>

          <div className="sets-section">
            <h3>Sets:</h3>
            <ul>
              {exercise.sets.map((set, idx) => (
                <li key={idx}>Set {idx + 1}: {set.reps} reps @ {set.weight} kg</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutSummary;