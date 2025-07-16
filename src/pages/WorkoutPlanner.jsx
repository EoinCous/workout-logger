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
  const [workoutType, setWorkoutType] = useState("push");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPlan) {
      setWorkoutType(currentPlan.type || "push");
      setSelectedExercises(currentPlan.exercises || []);
    }
  }, [currentPlan]);

  const filteredExercises = exercises.filter((ex) =>
    WORKOUT_TYPES[workoutType].includes(ex.muscle)
  );

  const handleAdd = (exercise) => {
    console.log(exercise)
    if (!selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleRemove = (id) => {
    console.log(id)
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
      <SelectedExerciseList
        exercises={selectedExercises}
        onRemove={handleRemove}
        onMove={handleMove}
      />
      <PlannerControls
        onSave={handleSaveWorkout}
        onStart={handleStartWorkout}
        onClearAll={handleClearAll}
        isDisabled={selectedExercises.length === 0}
      />
    </div>
  );
};

export default WorkoutPlanner;