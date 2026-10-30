import "../css/WorkoutLog.css";
import WorkoutExerciseCard from "../components/WorkoutExerciseCard";
import useWorkoutLog from "../hooks/useWorkoutLog";

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

  if (!currentLog) {
    return (
      <div className="loading-state">
        <p>Loading workout...</p>
      </div>
    );
  }

  return (
    <div className="workout-log fade-in">
      <header className="log-header">
        <h1 className="page-title">Log Workout</h1>
        <div className="workout-type-badge">
          {currentPlan?.type?.toUpperCase() ?? "ROUTINE"}
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
