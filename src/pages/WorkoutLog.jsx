import '../css/WorkoutLog.css';
import { useCallback, useEffect } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import { getCurrentPBs } from '../utils/pbUtils';
import { Link } from 'react-router-dom';
import { fetchWorkouts, insertWorkout } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';

const WorkoutLog = () => {
  const { status, setStatus, currentPlan, setCurrentPlan, currentLog, setCurrentLog, workouts, addWorkout } = useWorkout();
  const { user } = useAuthentication();
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

    const currentPBs = getCurrentPBs(workouts);
    const newPBs = {};

    completedWorkout.exercises.forEach(exercise => {
      const existingPB = currentPBs[exercise.id];

      exercise.sets.forEach(set => {
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps, 10);

        const isBetter =
          !existingPB ||
          weight > existingPB.weight ||
          (weight === existingPB.weight && reps > existingPB.reps);

        if (isBetter) {
          newPBs[exercise.id] = {
            name: exercise.name,
            weight,
            reps,
          };
        }
      });
    });

    completedWorkout.personalBests = newPBs;

    try {
      await insertWorkout(user.id, completedWorkout);
      const workouts = await fetchWorkouts(user.id);
      console.log(workouts);
      console.log("Workout inserted successfully");
    } catch (error) {
      console.error("Failed to insert workout:", error.message);
    }

    addWorkout(completedWorkout);
    setStatus("complete");
    setCurrentLog(null);
    setCurrentPlan(null);
    navigate(`/workout-summary/${completedWorkout.date}`);
  };

  if (!currentLog) return <p>Loading workout...</p>;

  const hasAnySets = currentLog.some(exercise => exercise.sets.length > 0);

  return (
    <div className="workout-log">
      <h1>Log Your Sets</h1>
      <p>Workout Type: {currentPlan.type.toUpperCase()}</p>

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