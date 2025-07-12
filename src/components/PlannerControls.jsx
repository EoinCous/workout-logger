const PlannerControls = ({ onStart, isDisabled }) => {
  return (
    <div className="planner-controls">
        <button onClick={onStart} disabled={isDisabled}>Start Workout</button>
    </div>
  );
};

export default PlannerControls;