import "../css/ExerciseList.css";

const ExerciseList = ({ exercises, selectedExercises, onAdd, onRemove }) => {
  return (
    <div className="exercise-list">
      {exercises.map((ex) => {
        const isSelected = selectedExercises.some((e) => e.id === ex.id);

        return (
          <div key={ex.id} className="exercise-card">
            <div className="exercise-info">
              <h4>{ex.name}</h4>
              <p>{ex.muscle}</p>
            </div>
            <button
              className={`exercise-add-btn ${isSelected ? "added" : ""}`}
              onClick={() => isSelected ? onRemove(ex.id) : onAdd(ex)}
            >
              {isSelected ? "✓" : "+"}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ExerciseList;