import { useState, useEffect } from "react";
import WorkoutTypeSelector from "../components/WorkoutTypeSelector";
import ExerciseList from "../components/ExerciseList";
import SelectedExerciseList from "../components/SelectedExerciseList";
import PlannerControls from "../components/PlannerControls";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import exercises from "../data/exercises.json";

const WORKOUT_TYPES = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  core: ["core"],
  full: ["chest", "back", "quads", "hamstrings", "glutes", "calves", "core", "shoulders", "biceps", "triceps"],
};

const WorkoutPlanner = () => {
  const { setStatus, currentPlan, setCurrentPlan } = useWorkout();
  const [workoutType, setWorkoutType] = useState("full");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPlan) {
      setWorkoutType(currentPlan.type || "push");
      setSelectedExercises(currentPlan.exercises || []);
    }
  }, [currentPlan]);

  useEffect(() => {
    setWorkoutSaved(false);
  }, [workoutType, selectedExercises]);

  const filteredExercises = exercises.filter((ex) =>
    WORKOUT_TYPES[workoutType].includes(ex.muscle)
  );

  const handleAdd = (exercise) => {
    if (!selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleRemove = (id) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== id));
  };

  const handleMove = (fromIndex, toIndex) => {
    const updated = [...selectedExercises];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setSelectedExercises(updated);
  };

  const handleSaveWorkout = () => {
    setCurrentPlan({
      type: workoutType,
      exercises: selectedExercises,
      date: new Date().toISOString(),
    });
    setStatus("planned");
    setWorkoutSaved(true);
  };

  const handleStartWorkout = () => {
    setCurrentPlan({
      type: workoutType,
      exercises: selectedExercises,
      date: new Date().toISOString(),
    });
    setStatus("inProgress");
    navigate("/workout-log");
  };

  const handleClearAll = () => {
    setCurrentPlan({
      type: workoutType,
      exercises: []
    })
  }

  return (
    <div className="planner-container">
      <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />
      <ExerciseList 
        exercises={filteredExercises} 
        selectedExercises={selectedExercises}
        onAdd={handleAdd} 
        onRemove={handleRemove}
      />

      {selectedExercises.length > 0 && (
        <>
          <SelectedExerciseList
            exercises={selectedExercises}
            onRemove={handleRemove}
            onMove={handleMove}
          />
          <PlannerControls
            onSave={handleSaveWorkout}
            onStart={handleStartWorkout}
            onClearAll={handleClearAll}
            workoutSaved={workoutSaved}
          />
        </>
      )}
    </div>
  );
};

export default WorkoutPlanner;