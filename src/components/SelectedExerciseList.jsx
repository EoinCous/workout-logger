import '../css/SelectedExerciseList.css';
import { FaTrash } from "react-icons/fa";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const SelectedExerciseList = ({ exercises, onRemove, onMove }) => {

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return; // Dropped outside the list
    if (source.index === destination.index) return; // No change
    onMove(source.index, destination.index);
  };

  return (
    <div className="selected-exercise-list">
      <h3>Selected Exercises</h3>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="exercises">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {exercises.map((exercise, index) => (
                <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`selected-exercise ${
                        snapshot.isDragging ? "dragging" : ""
                      }`}
                    >
                      <div className="exercise-info">
                        <span>{exercise.name}</span>
                        <p className="text-muted">{exercise.muscle}</p>
                      </div>

                      <div className="buttons">
                        <button
                          className="remove-exercise"
                          onClick={() => onRemove(exercise.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default SelectedExerciseList;