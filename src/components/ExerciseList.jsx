const ExerciseList = ({ exercises, onAdd }) => {
  return (
    <div className="exercise-list">
      {exercises.map((ex) => (
        <div key={ex.id} className="exercise-card" onClick={() => onAdd(ex)}>
          <h4>{ex.name}</h4>
          <p>{ex.muscle}</p>
        </div>
      ))}
    </div>
  );
};

export default ExerciseList;