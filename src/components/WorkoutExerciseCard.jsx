import { memo } from "react";
import { Link } from "react-router-dom";

const WorkoutExerciseCard = memo(({ exercise, onInputChange, onAddSet, onCopyLastSet, onRemoveSet }) => {
  const { id, name, sets, newReps, newWeight } = exercise;

  return (
    <div className="exercise-log-card">
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
            onClick={() => onCopyLastSet(id)}
            title="Instant copy last set"
          >
            🔄 Copy Last Set
          </button>
        )}
      </div>

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
                onClick={() => onRemoveSet(id, index)}
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
        onSubmit={(event) => {
          event.preventDefault();
          onAddSet(id);
        }}
      >
        <div className="input-group">
          <input
            type="number"
            step="any"
            inputMode="decimal"
            placeholder="Weight (kg)"
            value={newWeight}
            onChange={(event) => onInputChange(id, "newWeight", event.target.value)}
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={newReps}
            required={newWeight !== ""}
            onChange={(event) => onInputChange(id, "newReps", event.target.value)}
          />
        </div>
        <button type="submit" className="submit-set-btn" disabled={!newReps}>
          + Add Set
        </button>
      </form>
    </div>
  );
});

export default WorkoutExerciseCard;
