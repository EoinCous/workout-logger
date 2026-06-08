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

// Hoisted helper function to keep component renders lightweight
const calculateNewPersonalBests = (previousWorkouts, completedWorkout) => {
  const previousPBs = getCurrentPBs(previousWorkouts);
  const updatedPBs = getCurrentPBs([...previousWorkouts, completedWorkout]);

  const newPBs = {};
  for (const [id, updated] of Object.entries(updatedPBs)) {
    const prev = previousPBs[id];
    if (
      !prev || 
      updated.weight > prev.weight || 
      (updated.weight === prev.weight && updated.reps > prev.reps)
    ) {
      newPBs[id] = updated;
    }
  }
  return newPBs;
};

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
    ? exerciseList.filter(ex => !currentLog.exercises.some(logEx => logEx.id === ex.id))
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

  const isValidInput = (value) => {
    if (value === "") return false;
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  };

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

  const copyLastSet = useCallback((exerciseId) => {
    setCurrentLog(prevLog => ({
      ...prevLog,
      exercises: prevLog.exercises.map(exercise => {
        if (exercise.id !== exerciseId || exercise.sets.length === 0) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
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
        return { ...exercise, sets: exercise.sets.filter((_, i) => i !== setIndex) };
      })
    }));
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
    setSelectedExerciseId("");
  };

  const cancelWorkout = () => {
    // High Value Safety Guard
    const confirmCancel = window.confirm("Are you sure you want to cancel this workout? All current progress will be lost.");
    if (!confirmCancel) return;

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

    completedWorkout.personalBests = calculateNewPersonalBests(workouts, completedWorkout);

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

  if (!currentLog) return <div className="loading-state"><p>Loading workout...</p></div>;

  const hasAnySets = currentLog?.exercises?.some(exercise => exercise.sets.length > 0) ?? false;

  return (
    <div className="workout-log fade-in">
      <header className="log-header">
        <h1 className="page-title">Log Workout</h1>
        <div className="workout-type-badge">
          {currentPlan?.type?.toUpperCase() ?? "ROUTINE"}
        </div>
      </header>

      {currentLog.exercises.map(({ id, name, sets, newReps, newWeight }) => (
        <div key={id} className="exercise-log-card">
          <div className="card-header">
            <h3>
              <Link to={`/exercise/${id}`} state={{ from: '/workout' }} className="exercise-link">
                {name} <span className="info-icon">ℹ️</span>
              </Link>
            </h3>
            {sets.length > 0 && (
              <button 
                type="button" 
                className="copy-set-btn" 
                onClick={() => copyLastSet(id)}
                title="Copy values from your last set"
              >
                🔄 Copy Last Set
              </button>
            )}
          </div>

          {/* Structured Set List Container */}
          {sets.length > 0 && (
            <div className="sets-container">
              <div className="set-row-header">
                <span>Set</span>
                <span>Weight</span>
                <span>Reps</span>
                <span>Action</span>
              </div>
              {sets.map((set, index) => (
                <div key={index} className="set-row-item">
                  <span className="set-index-label">{index + 1}</span>
                  <span>{set.weight} kg</span>
                  <span>{set.reps} reps</span>
                  <button
                    type="button"
                    className="remove-set-btn"
                    onClick={() => removeSet(id, index)}
                    aria-label="Remove set"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}

          <form
            className="add-set-form"
            onSubmit={(e) => {
              e.preventDefault();
              addSet(id);
            }}
          >
            <div className="input-group">
              <input
                type="number"
                step="any"
                inputMode="decimal"
                placeholder="Weight (kg)"
                value={newWeight}
                onChange={(e) => handleInputChange(id, "newWeight", e.target.value)}
              />
              <input
                type="number"
                inputMode="numeric"
                placeholder="Reps"
                value={newReps}
                required={newWeight !== ""}
                onChange={(e) => handleInputChange(id, "newReps", e.target.value)}
              />
            </div>
            <button type="submit" className="submit-set-btn" disabled={!newReps}>
              + Add Set
            </button>
          </form>
        </div>
      ))}

      <div className="add-exercise-section">
        <h4 className="sub-heading">Add Extra Exercise</h4>
        <div className="add-exercise-controls">
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
          >
            <option value="">Select exercise...</option>
            {availableExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <button 
            className="add-exercise-btn" 
            onClick={() => addExercise(selectedExerciseId)}
            disabled={!selectedExerciseId}
          >
            Add
          </button>
        </div>
      </div>

      {hasAnySets && (
        <textarea
          className="workout-notes"
          placeholder="Write custom notes about your session here (energy levels, active goals)..."
          value={currentLog.notes}
          maxLength={500}
          onChange={(e) => 
            setCurrentLog(prevLog => ({
              ...prevLog,
              notes: e.target.value
            }))}
        />
      )}

      {/* Balanced Strategic Execution CTAs */}
      <div className="action-footer">
        <button className="cancel-workout-btn" onClick={cancelWorkout}>
          Cancel Session
        </button>
        {hasAnySets && (
          <button className="complete-workout-btn" onClick={completeWorkout}>
            Complete Workout
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutLog;