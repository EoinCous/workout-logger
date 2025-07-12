import "../css/ExerciseList.css"; // Assuming you’ll write your CSS here

const ExerciseList = ({ exercises, selectedExercises, onAdd }) => {
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
              onClick={() => onAdd(ex)}
              disabled={isSelected}
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