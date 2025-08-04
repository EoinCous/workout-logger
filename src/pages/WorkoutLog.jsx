import '../css/WorkoutLog.css';
import { useCallback, useEffect } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import { clearCurrentPlan, fetchWorkouts, insertWorkout } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';
import { Link } from 'react-router-dom';
import { handleSupabaseAuthError } from '../utils/authErrorHandler';

const WorkoutLog = () => {
  const { status, setStatus, currentPlan, setCurrentPlan, currentLog, setCurrentLog, setWorkouts } = useWorkout();
  const { userId, logout } = useAuthentication();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentLog && currentPlan && status === "inProgress") {
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
        if (!isValidInput(newReps) || !isValidInput(newWeight)) return exercise;

        return {
          ...exercise,
          sets: [...sets, { reps: newReps, weight: newWeight }],
          newReps: "",
          newWeight: "",
        };
      });
    });
  }, [setCurrentLog]);

  const isValidInput = (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  };

  const removeSet = useCallback((exerciseId, setIndex) => {
    setCurrentLog(prevLog =>
      prevLog.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        const newSets = exercise.sets.filter((_, i) => i !== setIndex);
        return { ...exercise, sets: newSets };
      })
    );
  }, [setCurrentLog]);

  const cancelWorkout = () => {
    setStatus("idle");
    setCurrentLog(null);
    navigate("/workout");
  };

  const completeWorkout = async () => {
    const completedWorkout = {
      ...currentPlan,
      exercises: currentLog.filter(ex => ex.sets.length > 0),
      completedAt: new Date().toISOString()
    };
    
    try {
      await insertWorkout(userId, completedWorkout);

      const fetchedWorkouts = await fetchWorkouts(userId);
      setWorkouts(fetchedWorkouts);

      await clearCurrentPlan(userId);
      setCurrentPlan(null);
      setStatus("complete");
      setCurrentLog(null);

      navigate(`/workout-summary`, { state: { workout: completedWorkout } });
    } catch (error) {
      handleSupabaseAuthError(err, logout);
      console.error(error);
    }
  };

  if (!currentLog) return <p>Loading workout...</p>;

  const hasAnySets = currentLog.some(exercise => exercise.sets.length > 0);

  return (
    <div className="workout-log">
      <h1>Log Your Sets</h1>
      <p>Workout Type: {currentPlan?.type?.toUpperCase() ?? "Unknown"}</p>

      {currentLog.map(({ id, name, sets, newReps, newWeight }) => (
        <div key={id} className="exercise-log-card">
          <h3>
            <Link to={`/exercise/${id}`} state={{ from: '/workout' }} className="exercise-link">
              {name} <span className="info-icon">ℹ️</span>
            </Link>
          </h3>

          <ul>
            {sets.map((set, index) => (
              <li key={index}>
                {set.reps} reps @ {set.weight}kg
                <button
                  className="remove-set-btn"
                  onClick={() => removeSet(id, index)}
                  aria-label="Remove set"
                >
                  ❌
                </button>
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