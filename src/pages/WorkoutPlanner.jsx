import { useState, useEffect, useRef, useMemo } from "react";
import WorkoutTypeSelector from "../components/WorkoutTypeSelector";
import GenerateWorkout from "../components/GenerateWorkout";
import ExerciseList from "../components/ExerciseList";
import SelectedExerciseList from "../components/SelectedExerciseList";
import PlannerControls from "../components/PlannerControls";
import { useWorkout } from "../context/WorkoutContext";
import { useNavigate } from "react-router-dom";
import exercises from "../data/exercises.json";
import { clearCurrentPlan, upsertCurrentPlan } from "../supabase/supabaseWorkoutService";
import { useAuthentication } from "../context/AuthenticationContext";
import { handleSupabaseAuthError } from "../utils/authErrorHandler";
import { hydrateExercises } from "../utils/exerciseUtils";
import SearchInput from "../components/SearchInput";
import "../css/WorkoutPlanner.css";
import {
  ALL_MUSCLE_CATEGORY,
  ALL_MUSCLES,
  getWorkoutMuscleCategory,
  MUSCLE_CATEGORIES,
} from "../constants/muscleGroups";

const WorkoutPlanner = () => {
  const { setStatus, currentPlan, setCurrentPlan } = useWorkout();
  const { user, logout } = useAuthentication();
  const navigate = useNavigate();

  const [workoutType, setWorkoutType] = useState("full");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddSection, setShowAddSection] = useState(selectedExercises.length === 0);
  const [category, setCategory] = useState(ALL_MUSCLE_CATEGORY);
  const [muscle, setMuscle] = useState(ALL_MUSCLE_CATEGORY);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const isHydrating = useRef(true);
  const lastHydratedWorkoutType = useRef(null);

  useEffect(() => {
    if (!currentPlan) {
      setShowAddSection(true);
      return;
    }
    isHydrating.current = true;
    const planType = currentPlan.type ?? "push";
    setWorkoutType(planType);
    if (lastHydratedWorkoutType.current !== planType) {
      setCategory(getWorkoutMuscleCategory(planType));
      setMuscle(ALL_MUSCLE_CATEGORY);
      lastHydratedWorkoutType.current = planType;
    }
    const hydratedExercises = hydrateExercises(currentPlan.exercises) ?? [];
    setSelectedExercises(hydratedExercises);
    setShowAddSection(hydratedExercises.length === 0);
  }, [currentPlan]);

  useEffect(() => {
    if (!isHydrating.current) setWorkoutSaved(false);
    isHydrating.current = false;
  }, [workoutType, selectedExercises]);

  const availableMuscles = useMemo(() => {
    if (category === ALL_MUSCLE_CATEGORY) return ALL_MUSCLES;
    return MUSCLE_CATEGORIES[category] || [];
  }, [category]);

  const muscleOptions = [ALL_MUSCLE_CATEGORY, ...availableMuscles];

  const handleWorkoutTypeChange = (type) => {
    setWorkoutType(type);
    setCategory(getWorkoutMuscleCategory(type));
    setMuscle(ALL_MUSCLE_CATEGORY);
  };

  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    []
  );

  const handleGeneratedExercises = (generatedExercises) => {
    setSelectedExercises((currentExercises) => {
      const selectedIds = new Set(currentExercises.map((exercise) => exercise.id));
      const newExercises = generatedExercises.filter((exercise) => !selectedIds.has(exercise.id));
      return [...currentExercises, ...newExercises];
    });
    setShowAddSection(false);
  };

  const handleGenerateStart = async () => {
    setSelectedExercises([]);
    setWorkoutSaved(false);
    setCurrentPlan(null);

    try {
      if (user?.id) await clearCurrentPlan(user.id);
    } catch (error) {
      console.error("Failed to clear current plan before generating workout:", error);
      handleSupabaseAuthError(error, logout);
      throw error;
    }
  };

  const filteredExercises = useMemo(() =>
    sortedExercises.filter(ex => {
      // If a category is selected (Push/Pull/etc), check if exercise muscle is in that list
      if (category !== ALL_MUSCLE_CATEGORY) {
        const categoryMuscles = MUSCLE_CATEGORIES[category] || [];
        if (!categoryMuscles.includes(ex.muscle)) return false;
      }
      
      if (muscle !== ALL_MUSCLE_CATEGORY && ex.muscle !== muscle) return false;
      if (!ex.name.toLowerCase().includes(search.toLowerCase())) return false;
      
      return true;
    }),
  [sortedExercises, category, muscle, search]);

  const handleAdd = (exercise) => {
    if (!selectedExercises.find((e) => e.id === exercise.id)) {
      setSelectedExercises([...selectedExercises, exercise]);
    }
  };

  const handleRemove = (id) => {
    const updated = selectedExercises.filter((e) => e.id !== id);
    setSelectedExercises(updated);
    if (updated.length === 0) {
      setShowAddSection(true);
    }
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
      await upsertCurrentPlan(user?.id, plan);
      setStatus("planned");
    } catch (err) {
      console.error("Failed to save plan:", err);
      setWorkoutSaved(false);
      handleSupabaseAuthError(err, logout);
    }
  };

  const handleStartWorkout = async () => {
    const plan = { ...buildPlan(), startedAt: new Date().toISOString() };
    setCurrentPlan(plan);
    try {
      await upsertCurrentPlan(user?.id, plan);
      navigate("/workout-log");
      setStatus("inProgress");
    } catch (err) {
      handleSupabaseAuthError(err, logout);
      console.error("Failed to start workout:", err);
      navigate('/workout-planner')
    }
  };

  const handleClearAll = async () => {
    const plan = { type: workoutType, exercises: [], date: new Date().toISOString() };
    setCurrentPlan(plan);
    try {
    await upsertCurrentPlan(user?.id, plan);
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
      <WorkoutTypeSelector
        value={workoutType}
        onChange={handleWorkoutTypeChange}
        disabled={isGeneratingWorkout}
      />
      <GenerateWorkout
        workoutType={workoutType}
        exercises={sortedExercises}
        selectedExercises={selectedExercises}
        onExercisesGenerated={handleGeneratedExercises}
        onGeneratingChange={setIsGeneratingWorkout}
        onGenerateStart={handleGenerateStart}
      />
      
      <div className="add-exercise-section">
        <h3 
          className="collapsible-header" 
          onClick={() => setShowAddSection(!showAddSection)}
        >
          Add Exercises {showAddSection ? "▾" : "▸"} ({selectedExercises.length} selected)
        </h3>

        {showAddSection && (
          <div className="collapsible-content">
            <SearchInput value={search} onChange={setSearch} />

            <div className="filters-row">
              <select
                value={category} 
                onChange={(e) => {
                  setCategory(e.target.value);
                  setMuscle(ALL_MUSCLE_CATEGORY);
                }}
              >
                <option value={ALL_MUSCLE_CATEGORY}>All Categories</option>
                {Object.keys(MUSCLE_CATEGORIES).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
                {muscleOptions.map(m => (
                  <option key={m} value={m}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
            </div>

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
          </div>
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