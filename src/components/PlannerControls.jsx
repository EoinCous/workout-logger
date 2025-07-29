import '../css/PlannerControls.css';

const PlannerControls = ({ onSave, onStart, onClearAll, workoutSaved }) => {
  return (
    <div className="planner-controls">
      <button 
        onClick={onSave}
        disabled={workoutSaved}
        className={`save-button ${workoutSaved ? 'saved' : ''}`}
      >
        {workoutSaved ? 'Saved ✓' : 'Save Plan'}
      </button>

      <button onClick={onStart} className="start-button">
        Start Workout
      </button>

      <button onClick={onClearAll} className="clear-button">
        Clear All
      </button>
    </div>
  );
};

export default PlannerControls;