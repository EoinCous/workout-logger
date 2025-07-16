const PlannerControls = ({ onSave, onStart, onClearAll, isDisabled }) => {
  return (
    <div className="planner-controls">
      <button onClick={onSave} disabled={isDisabled}>Save Plan</button>
      <button onClick={onStart} disabled={isDisabled}>Start Workout</button>
      <button onClick={onClearAll} disabled={isDisabled}>Clear All</button>
    </div>
  );
};

export default PlannerControls;