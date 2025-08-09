import { useLocation } from 'react-router-dom';
import '../css/WorkoutSummary.css';
import BackButton from '../components/BackButton';
import { hydrateExercises } from '../utils/exerciseUtils';

const WorkoutSummary = () => {
  const location = useLocation();
  const workout = location.state.workout;

  if (!workout) {
    return <p className="not-found">Workout not found.</p>;
  }

  const formattedStartDate = new Date(workout.date).toLocaleString();
  const formattedCompletedDate = new Date(workout.completedAt).toLocaleString();
  const durationMs = new Date(workout.completedAt) - new Date(workout.date);
  const durationMins = Math.round(durationMs / 1000 / 60);

  const hydratedExercises = hydrateExercises(workout.exercises);

  return (
    <div>
      <BackButton previousPage={'/history'}/>
      <div className="summary-container">
        <h2 className="workout-title">💪 {workout.type.toUpperCase()} Workout</h2>
        <p className="workout-meta">Started: {formattedStartDate}</p>
        <p className="workout-meta">Completed: {formattedCompletedDate}</p>
        <p className="workout-meta">Duration: {durationMins} minutes</p>

        {hydratedExercises.map((ex, index) => (
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

          {workout.personalBests && Object.keys(workout.personalBests).length > 0 && (
            <div className="new-pbs">
              <h3>🏅 New Personal Bests</h3>
              <ul>
                {Object.values(workout.personalBests).map(personalBest => (
                  <li key={personalBest.name}>
                    {personalBest.name}: {personalBest.weight}kg × {personalBest.reps} reps
                  </li>
                ))}
              </ul>
            </div>
          )}

          {workout.notes && (
            <div className="workout-notes-summary">
              <h3>Notes 📝</h3>
              <p>{workout.notes}</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default WorkoutSummary;