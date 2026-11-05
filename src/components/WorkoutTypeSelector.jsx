import '../css/WorkoutTypeSelector.css';

const types = [
  { value: "push", label: "Push", description: "Chest, shoulders, triceps" },
  { value: "pull", label: "Pull", description: "Back and biceps" },
  { value: "legs", label: "Legs", description: "Lower-body focus" },
  { value: "upper", label: "Upper Body", description: "Push + pull" },
  { value: "core", label: "Core", description: "Abs and stability" },
  { value: "full", label: "Full Body", description: "A complete workout" },
];

const WorkoutTypeSelector = ({ value, onChange, disabled = false }) => {
  return (
    <div className="workout-type-selector" role="group" aria-label="Workout type">
      <p className="workout-type-selector__label">Choose a workout focus</p>
      <div className="workout-type-selector__options">
        {types.map(({ value: type, label, description }) => (
          <button
            key={type}
            type="button"
            className={`workout-type-selector__option${value === type ? " active" : ""}`}
            aria-pressed={value === type}
            disabled={disabled}
            onClick={() => onChange(type)}
          >
            <span className="workout-type-selector__option-label">{label}</span>
            <span className="workout-type-selector__option-description">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorkoutTypeSelector;