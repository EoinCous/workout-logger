import { useState, useEffect, useRef } from "react";
import WorkoutTypeSelector from "../components/WorkoutTypeSelector";
import ExerciseList from "../components/ExerciseList";
import SelectedExerciseList from "../components/SelectedExerciseList";
import PlannerControls from "../components/PlannerControls";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import exercises from "../data/exercises.json";
import { upsertCurrentPlan } from "../supabase/supabaseWorkoutService";
import { useAuthentication } from "../context/AuthenticationContext";
import { handleSupabaseAuthError } from "../utils/authErrorHandler";
import { hydrateExercises } from "../utils/exerciseUtils";
import SearchInput from "../components/SearchInput";

const WORKOUT_TYPES = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  core: ["core"],
  full: ["chest", "back", "quads", "hamstrings", "glutes", "calves", "core", "shoulders", "biceps", "triceps"],
};

const WorkoutPlanner = () => {
  const { setStatus, currentPlan, setCurrentPlan } = useWorkout();
  const { userId, logout } = useAuthentication();
  const [workoutType, setWorkoutType] = useState("full");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [search, setSearch] = useState("");
  const isHydrating = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentPlan) {
      isHydrating.current = true;
      setWorkoutType(currentPlan.type || "push");
      setSelectedExercises(hydrateExercises(currentPlan.exercises) || []);
    }
  }, [currentPlan]);

  useEffect(() => {
    if (isHydrating.current) {
      isHydrating.current = false;
    } else {
      setWorkoutSaved(false);
    }
  }, [workoutType, selectedExercises]);

  const filteredExercises = exercises
    .filter((ex) => WORKOUT_TYPES[workoutType].includes(ex.muscle))
    .filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()));

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

  const handleSaveWorkout = async () => {
    const plan = buildPlan();
    setWorkoutSaved(true);
    setCurrentPlan(plan);
    try {
      await upsertCurrentPlan(userId, plan);
      setStatus("planned");
    } catch (err) {
      console.error("Failed to save plan:", err);
      setWorkoutSaved(false);
      handleSupabaseAuthError(err, logout);
    }
  };

  const handleStartWorkout = async () => {
    const plan = buildPlan();
    setCurrentPlan(plan);
    try {
      await upsertCurrentPlan(userId, plan);
      navigate("/workout-log");
      setStatus("inProgress");
    } catch (err) {
      handleSupabaseAuthError(err, logout);
      console.error("Failed to start workout:", err);
      navigate('workout-planner')
    }
  };

  const handleClearAll = async () => {
    const plan = { type: workoutType, exercises: [], date: new Date().toISOString() };
    setCurrentPlan(plan);
    try {
    await upsertCurrentPlan(userId, plan);
    } catch (err) {
      handleSupabaseAuthError(err, logout);
      console.error("Failed to clear plan:", err);
    }
  }

  const buildPlan = () => ({
    type: workoutType,
    exercises: selectedExercises,
    date: new Date().toISOString(),
  });

  return (
    <div className="planner-container">
      <h1 className="page-title">Plan Workout</h1>
      <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />
      
      <SearchInput
        value={search}
        onChange={setSearch}
      />

      <div className="exercise-list">
        {filteredExercises.length > 0 ? (
          <ExerciseList 
            exercises={filteredExercises} 
            selectedExercises={selectedExercises}
            onAdd={handleAdd} 
            onRemove={handleRemove}
          />
        ) : (
          <p className="no-results">
            No exercises found. 
            Try search in "full" workout type. 
            If it's not there, 
            you can request the addition of your exercise through the suggestions form in the Home page.
          </p>
        )}
      </div>
      

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