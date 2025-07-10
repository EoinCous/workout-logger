const SelectedExerciseList = ({ exercises, onRemove, onMove }) => {

    return (
        <div className="selected-exercise-list">
        <h3>Selected Exercises</h3>
        {exercises.map((ex, index) => (
            <div key={ex.id} className="selected-exercise">
            <span>{ex.name}</span>
            <div>
                <button disabled={index === 0} onClick={() => onMove(index, index - 1)}>⬆️</button>
                <button
                disabled={index === exercises.length - 1}
                onClick={() => onMove(index, index + 1)}
                >⬇️</button>
                <button onClick={() => onRemove(ex.id)}>❌</button>
            </div>
            </div>
        ))}
        </div>
    );
};

export default SelectedExerciseList;