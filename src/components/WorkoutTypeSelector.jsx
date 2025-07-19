import '../css/WorkoutTypeSelector.css';

const types = ["push", "pull", "legs", "core", "full"];

const WorkoutTypeSelector = ({ value, onChange }) => {
  return (
    <div className="workout-type-selector">
      {types.map((type) => (
        <button
          key={type}
          className={value === type ? "active" : ""}
          onClick={() => onChange(type)}
        >
          {type.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default WorkoutTypeSelector;