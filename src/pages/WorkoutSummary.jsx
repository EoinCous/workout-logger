import { useParams } from 'react-router-dom';
import { useWorkout } from "../context/WorkoutContext";
import '../css/WorkoutSummary.css';
import BackButton from '../components/BackButton';

const WorkoutSummary = () => {
  const { date } = useParams();
  const { workouts } = useWorkout();
  const workout = workouts.find((workout) => workout.date === date);

  if (!workout) {
    return <p className="not-found">Workout not found.</p>;
  }

  const formattedStartDate = new Date(workout.date).toLocaleString();
  const formattedCompletedDate = new Date(workout.completedAt).toLocaleString();
  const durationMs = new Date(workout.completedAt) - new Date(workout.date);
  const durationMins = Math.round(durationMs / 1000 / 60);

  return (
    <div>
      <BackButton />
      <div className="summary-container">
        <h2 className="workout-title">💪 {workout.type.toUpperCase()} Workout</h2>
        <p className="workout-meta">Started: {formattedStartDate}</p>
        <p className="workout-meta">Completed: {formattedCompletedDate}</p>
        <p className="workout-meta">Duration: {durationMins} minutes</p>

        {workout.exercises.map((ex, index) => (
              <div key={ex.id} className="exercise-summary">
                <h3 className='exercise-name'>{index + 1}. {ex.name}</h3>
                <p className="exercise-desc">{ex.description}</p>
                <ul>
                  {ex.sets.map((set, index) => (
                    <li key={index}>
                      {set.reps} reps @ {set.weight}kg
                    </li>
                  ))}
                </ul>
              </div>
            ))}
      </div>
    </div>
  );
};

export default WorkoutSummary;