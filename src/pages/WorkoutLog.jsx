import '../css/WorkoutLog.css';
import { useState, useCallback, useEffect } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";

const WorkoutLog = () => {
  const { setStatus, currentPlan, currentLog, setCurrentLog, addWorkoutToHistory } = useWorkout();
  const navigate = useNavigate();

  const [log, setLog] = useState(() => {
    if (currentLog) return currentLog;
    return currentPlan.exercises.map((exercise) => ({
      ...exercise,
      sets: [],
      newReps: "",
      newWeight: "",
    }));
  });

  useEffect(() => {
    setCurrentLog(log);
  }, [log, setCurrentLog]);

  const handleInputChange = useCallback((id, field, value) => {
    setLog(prevLog =>
      prevLog.map(exercise =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise
      )
    );
  }, []);

  const addSet = useCallback((id) => {
    setLog(prevLog =>
      prevLog.map(exercise => {
        if (exercise.id !== id) return exercise;

        const { newReps, newWeight, sets } = exercise;
        if (!newReps || !newWeight) return exercise;

        return {
          ...exercise,
          sets: [...sets, { reps: newReps, weight: newWeight }],
          newReps: "",
          newWeight: "",
        };
      })
    );
  }, []);

  const cancelWorkout = () => {
    setStatus("idle");
    setCurrentLog(null);
    navigate("/workout");
  };

  const completeWorkout = () => {
    const completedWorkout = {
      ...currentPlan,
      exercises: log.filter(exercise => exercise.sets.length > 0),
      completedAt: new Date().toISOString(),
    };

    addWorkoutToHistory(completedWorkout);
    setStatus("complete");
    setCurrentLog(null);
    navigate("/history");
  };

  const hasAnySets = log.some(exercise => exercise.sets.length > 0);

  return (
    <div className="workout-log">
      <h1>Log Your Sets</h1>
      <p>Workout Type: {currentPlan.type.toUpperCase()}</p>

      {log.map(({ id, name, sets, newReps, newWeight }) => (
        <div key={id} className="exercise-log-card">
          <h3>{name}</h3>

          <ul>
            {sets.map((set, index) => (
              <li key={index}>
                {set.reps} reps @ {set.weight}kg
              </li>
            ))}
          </ul>

          <div className="add-set-form">
            <input
              type="number"
              placeholder="Reps"
              value={newReps}
              onChange={(e) => handleInputChange(id, "newReps", e.target.value)}
            />
            <input
              type="number"
              placeholder="Weight"
              value={newWeight}
              onChange={(e) => handleInputChange(id, "newWeight", e.target.value)}
            />
            <button onClick={() => addSet(id)}>➕</button>
          </div>
        </div>
      ))}

      <button className="cancel-workout-btn" onClick={cancelWorkout}>
        Cancel Workout
      </button>

      {hasAnySets && (
        <button className="complete-workout-btn" onClick={completeWorkout}>
          Complete Workout
        </button>
      )}
    </div>
  );
};

export default WorkoutLog;