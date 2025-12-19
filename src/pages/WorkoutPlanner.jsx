import { useState, useEffect, useRef, useMemo } from "react";
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
import "../css/WorkoutPlanner.css";

const CATEGORIES = {
  all: [
    "chest","shoulders","triceps","back","biceps","quads","hamstrings","glutes","calves","core"
  ],
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  core: ["core"]
};

const WorkoutPlanner = () => {
  const { setStatus, currentPlan, setCurrentPlan } = useWorkout();
  const { user, logout } = useAuthentication();
  const [workoutType, setWorkoutType] = useState("full");
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [workoutSaved, setWorkoutSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddSection, setShowAddSection] = useState(true);
  const [category, setCategory] = useState("all");
  const [muscle, setMuscle] = useState("all");
  const isHydrating = useRef(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentPlan) return;
    isHydrating.current = true;
    setWorkoutType(currentPlan.type ?? "push");
    setSelectedExercises(hydrateExercises(currentPlan.exercises) ?? []);
  }, [currentPlan]);

  useEffect(() => {
    if (!isHydrating.current) setWorkoutSaved(false);
    isHydrating.current = false;
  }, [workoutType, selectedExercises]);

  const availableMuscles =
    category === "all"
      ? [...new Set(exercises.map(e => e.muscle))] 
      : CATEGORIES[category];

  const muscleOptions = ["all", ...availableMuscles];

  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => a.name.localeCompare(b.name)),
    [exercises]
  );

  const filteredExercises = useMemo(() =>
    sortedExercises.filter(ex => {
      if (category !== "all" && !CATEGORIES[category].includes(ex.muscle)) return false;
      if (muscle !== "all" && ex.muscle !== muscle) return false;
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
      await upsertCurrentPlan(user?.id, plan);
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
      await upsertCurrentPlan(user?.id, plan);
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
      <WorkoutTypeSelector value={workoutType} onChange={setWorkoutType} />
      
      <div className="add-exercise-section">
        <h3 
          className="collapsible-header" 
          onClick={() => setShowAddSection(!showAddSection)}
        >
          Add Exercises {showAddSection ? "▾" : "▸"}
        </h3>

        {showAddSection && (
          <div className="collapsible-content">
            <SearchInput value={search} onChange={setSearch} />

            <div className="filters-row">
              <select value={category} onChange={(e) => {
                setCategory(e.target.value);
                setMuscle("all"); // reset when category changes
              }}>
                {Object.keys(CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
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