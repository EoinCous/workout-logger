import '../css/SelectedExerciseList.css';
import { FaChevronUp, FaChevronDown, FaTrash } from "react-icons/fa";

const SelectedExerciseList = ({ exercises, onRemove, onMove }) => {
    return (
        <div className="selected-exercise-list">
        <h3>Selected Exercises</h3>
        {exercises.map((exercise, index) => (
            <div key={exercise.id} className="selected-exercise">
                <div className='exercise-info'>
                    <span>{exercise.name}</span>
                    <p className='text-muted'>{exercise.muscle}</p>
                </div>
                
                <div>
                    <button disabled={index === 0} onClick={() => onMove(index, index - 1)}>
                        <FaChevronUp />
                    </button>
                    <button disabled={index === exercises.length - 1} onClick={() => onMove(index, index + 1)}>
                        <FaChevronDown />
                    </button>
                    <button className='remove-exercise' onClick={() => onRemove(exercise.id)}>
                        <FaTrash />
                    </button>
                </div>
            </div>
        ))}
        </div>
    );
};

export default SelectedExerciseList;