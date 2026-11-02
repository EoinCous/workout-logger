import "../css/WorkoutLog.css";
import { useEffect, useState } from "react";
import WorkoutExerciseCard from "../components/WorkoutExerciseCard";
import useWorkoutLog from "../hooks/useWorkoutLog";

const formatElapsedTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

const WorkoutLog = () => {
  const {
    currentLog,
    currentPlan,
    selectedExerciseId,
    setSelectedExerciseId,
    isSubmitting,
    availableExercises,
    handleInputChange,
    addSet,
    copyLastSet,
    removeSet,
    addExercise,
    cancelWorkout,
    completeWorkout,
    updateNotes,
    hasAnySets,
  } = useWorkoutLog();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  if (!currentLog) {
    return (
      <div className="loading-state">
        <p>Loading workout...</p>
      </div>
    );
  }

  const startTime = Date.parse(currentLog.startedAt);
  const elapsedSeconds = Number.isFinite(startTime)
    ? Math.max(0, Math.floor((now - startTime) / 1000))
    : 0;

  return (
    <div className="workout-log fade-in">
      <header className="log-header">
        <h1 className="page-title">Log Workout</h1>
        <div className="log-header-meta">
          <div className="workout-timer">
            <span className="workout-timer-label">Duration</span>
            <time
              className="workout-timer-value"
              dateTime={`PT${elapsedSeconds}S`}
              role="timer"
              aria-label="Workout duration"
            >
              {formatElapsedTime(elapsedSeconds)}
            </time>
          </div>
          <div className="workout-type-badge">
            {currentPlan?.type?.toUpperCase() ?? "ROUTINE"}
          </div>
        </div>
      </header>

      {currentLog.exercises.map((exercise) => (
        <WorkoutExerciseCard
          key={exercise.id}
          exercise={exercise}
          onInputChange={handleInputChange}
          onAddSet={addSet}
          onCopyLastSet={copyLastSet}
          onRemoveSet={removeSet}
        />
      ))}

      <div className="add-exercise-section">
        <h4 className="sub-heading">Add Extra Exercise</h4>
        <div className="add-exercise-controls">
          <select
            value={selectedExerciseId}
            onChange={(event) => setSelectedExerciseId(event.target.value)}
          >
            <option value="">Select exercise...</option>
            {availableExercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
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
          placeholder="Write custom notes about your session here..."
          value={currentLog.notes}
          maxLength={500}
          onChange={(event) => updateNotes(event.target.value)}
        />
      )}

      <div className="action-footer">
        <button className="cancel-workout-btn" onClick={cancelWorkout}>
          Cancel Session
        </button>
        {hasAnySets && (
          <button
            className="complete-workout-btn"
            onClick={completeWorkout}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving Session..." : "Complete Workout"}
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutLog;
