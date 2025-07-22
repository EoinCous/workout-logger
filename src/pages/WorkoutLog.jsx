import '../css/WorkoutLog.css';
import { useCallback, useEffect } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";

const WorkoutLog = () => {
  const { setStatus, currentPlan, currentLog, setCurrentLog, addWorkoutToHistory } = useWorkout();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentLog && currentPlan) {
      const initializedLog = currentPlan.exercises.map((exercise) => ({
        ...exercise,
        sets: [],
        newReps: "",
        newWeight: "",
      }));
      setCurrentLog(initializedLog);
    }
  }, [currentLog, currentPlan, setCurrentLog]);

  const handleInputChange = useCallback((id, field, value) => {
    setCurrentLog(prevLog =>
      prevLog.map(exercise =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise
      )
    );
  }, [setCurrentLog]);

  const addSet = useCallback((id) => {
    setCurrentLog(prevLog => {
      return prevLog.map(exercise => {
        if (exercise.id !== id) return exercise;

        const { newReps, newWeight, sets } = exercise;
        if (!newReps || !newWeight) return exercise;

        return {
          ...exercise,
          sets: [...sets, { reps: newReps, weight: newWeight }],
          newReps: "",
          newWeight: "",
        };
      });
    });
  }, [setCurrentLog]);

  const cancelWorkout = () => {
    setStatus("idle");
    setCurrentLog(null);
    navigate("/workout");
  };

  const completeWorkout = () => {
    const completedWorkout = {
      ...currentPlan,
      exercises: currentLog.filter(ex => ex.sets.length > 0),
      completedAt: new Date().toISOString(),
    };

    addWorkoutToHistory(completedWorkout);
    setStatus("complete");
    setCurrentLog(null);
    navigate("/history");
  };

  const hasAnySets = currentLog.some(exercise => exercise.sets.length > 0);

  if (!currentLog) return <p>Loading workout...</p>;

  return (
    <div className="workout-log">
      <h1>Log Your Sets</h1>
      <p>Workout Type: {currentPlan.type.toUpperCase()}</p>

      {currentLog.map(({ id, name, sets, newReps, newWeight }) => (
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