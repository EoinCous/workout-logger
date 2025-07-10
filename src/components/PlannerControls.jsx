const PlannerControls = ({ onSave, onStart, isDisabled }) => {
  return (
    <div className="planner-controls">
        <button onClick={onSave} disabled={isDisabled}>Save Plan</button>
        <button onClick={onStart} disabled={isDisabled}>Start Workout</button>
    </div>
  );
};

export default PlannerControls;