import { useState } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";

const WorkoutLog = () => {
  const { currentPlan, setStatus, addWorkoutToHistory } = useWorkout();
  const [log, setLog] = useState(
    currentPlan.exercises.map((exercise) => ({
      ...exercise,
      sets: [],
    }))
  );

  const navigate = useNavigate();

  const addSet = (exerciseId) => {
    const reps = prompt("Enter reps:");
    const weight = prompt("Enter weight:");
    if (!reps || !weight) return;

    setLog((prevLog) =>
      prevLog.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, { reps, weight }] }
          : exercise
      )
    );
  };

  const cancelWorkout = () => {
    setStatus("idle");
    navigate("/workout");
  };

  const completeWorkout = () => {
    const completedWorkout = {
      ...currentPlan,
      exercises: log.filter((exercise) => exercise.sets.length > 0),
      completedAt: new Date().toISOString(),
    };
    addWorkoutToHistory(completedWorkout);
    setStatus("complete");
    navigate("/history");
  };

  const hasAnySets = log.some((exercise) => exercise.sets.length > 0);

  return (
    <div className="workout-log">
      <h1>Log Your Sets</h1>
      <p>Workout Type: {currentPlan.type.toUpperCase()}</p>

      {log.map((exercise) => (
        <div key={exercise.id} className="exercise-log-card">
          <h3>{exercise.name}</h3>
          <ul>
            {exercise.sets.map((set, index) => (
              <li key={index}>
                {set.reps} reps @ {set.weight}kg
              </li>
            ))}
          </ul>
          <button onClick={() => addSet(exercise.id)}>Add Set</button>
        </div>
      ))}

      <button className="cancel-workout-btn" onClick={cancelWorkout}>Cancel Workout</button>

      {hasAnySets && (
        <button className="complete-workout-btn" onClick={completeWorkout}>
          Complete Workout
        </button>
      )}
    </div>
  );
};

export default WorkoutLog;