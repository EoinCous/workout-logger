import '../css/WorkoutLog.css';
import { useCallback, useEffect, useState } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import { clearCurrentPlan, fetchWorkouts, insertWorkout } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';
import { Link } from 'react-router-dom';
import { handleSupabaseAuthError } from '../utils/authErrorHandler';
import { getCurrentPBs } from '../utils/pbUtils';
import exerciseList from '../data/exercises.json';

const WorkoutLog = () => {
  const { 
    status, setStatus, 
    currentPlan, setCurrentPlan, 
    currentLog, setCurrentLog, 
    workouts, setWorkouts 
  } = useWorkout();
  const { user, logout } = useAuthentication();
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentLog && currentPlan?.exercises && status === "inProgress") {
      const initialisedLog = {
        exercises: currentPlan.exercises.map((exercise) => ({
          ...exercise,
          sets: [],
          newReps: "",
          newWeight: "",
        })),
        notes: ""
      };
      setCurrentLog(initialisedLog);
    }
    
  }, [currentLog, currentPlan, setCurrentLog, status]);

  const availableExercises = (currentLog
    ? exerciseList.filter(
        ex => !currentLog.exercises.some(logEx => logEx.id === ex.id)
      )
    : exerciseList
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleInputChange = useCallback((id, field, value) => {
    setCurrentLog(prevLog => ({
      ...prevLog,
      exercises: prevLog.exercises.map(exercise =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise
      )
    }));
  }, [setCurrentLog]);

  const addSet = useCallback((id) => {
    setCurrentLog(prevLog => ({ 
      ...prevLog,  
      exercises: prevLog.exercises.map(exercise => {
        if (exercise.id !== id) return exercise;

        const { newReps, newWeight, sets } = exercise;

        if (!isValidInput(newReps)) return exercise;
        const validWeight = isValidInput(newWeight) ? newWeight : "0";

        return {
          ...exercise,
          sets: [...sets, { reps: newReps, weight: validWeight }],
          newReps: "",
          newWeight: "",
        };
      })
    }));
  }, [setCurrentLog]);

  const isValidInput = (value) => {
    if (value === "") return false;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  };

  const copyLastSet = useCallback((exerciseId) => {
    setCurrentLog(prevLog => ({
      ...prevLog,
      exercises: prevLog.exercises.map(exercise => {
        if (exercise.id !== exerciseId || exercise.sets.length === 0) return exercise;

        // Get the last set in the array
        const lastSet = exercise.sets[exercise.sets.length - 1];

        // Update the input fields with the last set's values
        return {
          ...exercise,
          newReps: lastSet.reps,
          newWeight: lastSet.weight,
        };
      })
    }));
  }, [setCurrentLog]);

  const removeSet = useCallback((exerciseId, setIndex) => {
    setCurrentLog(prevLog => ({
      ...prevLog,
      exercises: prevLog.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;

        const newSets = exercise.sets.filter((_, i) => i !== setIndex);
        return { ...exercise, sets: newSets };
      })
    })
    );
  }, [setCurrentLog]);

  const addExercise = (exerciseId) => {
    if (!exerciseId) return;

    const exerciseToAdd = exerciseList.find(ex => ex.id === exerciseId);
    if (!exerciseToAdd) return;

    setCurrentLog(prevLog => ({
      ...prevLog,
      exercises: [
        ...prevLog.exercises,
        {
          ...exerciseToAdd,
          sets: [],
          newReps: "",
          newWeight: "",
        }
      ]
    }));

    setSelectedExerciseId(""); // Reset dropdown
  };

  const cancelWorkout = () => {
    setStatus("idle");
    setCurrentLog(null);
    navigate("/workout");
  };

  const completeWorkout = async () => {
    const completedWorkout = {
      ...currentPlan,
      exercises: currentLog.exercises.filter(ex => ex.sets.length > 0),
      completedAt: new Date().toISOString(),
      notes: currentLog.notes
    };

    const personalBests = newPersonalBests(workouts, completedWorkout);
    completedWorkout.personalBests = personalBests;

    try {
      await insertWorkout(user?.id, completedWorkout);

      await clearCurrentPlan(user?.id);

      const fetchedWorkouts = await fetchWorkouts(user?.id);
      setWorkouts(fetchedWorkouts);
      setCurrentPlan(null);
      setStatus("complete");
      setCurrentLog(null);

      navigate(`/workout-summary`, { state: { workout: completedWorkout } });
    } catch (error) {
      handleSupabaseAuthError(error, logout);
      console.error("Failed to complete workout:", error);
      alert("Check your internet connection. Workout couldn't be saved.");
    }
  };

  const newPersonalBests = ((previousWorkouts, completedWorkout) => {
    const previousPBs = getCurrentPBs(previousWorkouts);
    const updatedPBs = getCurrentPBs([...previousWorkouts, completedWorkout]);

    const newPBs = {};
    for (const [id, updated] of Object.entries(updatedPBs)) {
      const prev = previousPBs[id];
      if (
        !prev || // new exercise logged
        updated.weight > prev.weight || // heavier lift
        (updated.weight === prev.weight && updated.reps > prev.reps) // same weight, more reps
      ) {
        newPBs[id] = updated;
      }
    }

    return newPBs;
  })

  if (!currentLog) return <p>Loading workout...</p>;

  const hasAnySets = currentLog?.exercises?.some(exercise => exercise.sets.length > 0) ?? false;

  return (
    <div className="workout-log">
      <h1 className='page-title'>Log Sets</h1>
      <p className="workout-type">
        <span>{currentPlan?.type?.toUpperCase() ?? "UNKNOWN"}</span>
      </p>

      {currentLog.exercises.map(({ id, name, sets, newReps, newWeight }) => (
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

          {sets.length > 0 && (
            <button 
              type="button" 
              className="copy-set-btn" 
              onClick={() => copyLastSet(id)}
            >
              🔄 Copy Last Set
            </button>
          )}

          <form
            className="add-set-form"
            onSubmit={(e) => {
              e.preventDefault();
              addSet(id);
            }}
          >
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
            <button type="submit">+</button>
          </form>
        </div>
      ))}

      <div className="add-exercise">
        <select
          value={selectedExerciseId}
          onChange={(e) => setSelectedExerciseId(e.target.value)}
        >
          <option value="">Select exercise...</option>
          {availableExercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        <button onClick={() => addExercise(selectedExerciseId)}>Add Exercise</button>
      </div>

      {hasAnySets && (
        <textarea
          className="workout-notes"
          placeholder="Optional notes about your workout..."
          value={currentLog.notes}
          maxLength={500}
          onChange={(e) => 
            setCurrentLog(prevLog => ({
              ...prevLog,
              notes: e.target.value
            }))}
        />
      )}

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