import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import "../css/GenerateWorkout.css";

const WORKOUT_TYPE_LABELS = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  core: "Core",
  full: "Full Body",
};

const GenerateWorkout = ({
  workoutType,
  exercises,
  selectedExercises,
  onExercisesGenerated,
  onGeneratingChange,
  onGenerateStart,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [completedGeneration, setCompletedGeneration] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedExerciseIds = selectedExercises.map((exercise) => exercise.id).sort();
  const isCurrentWorkoutGenerated =
    completedGeneration?.workoutType === workoutType &&
    completedGeneration.exerciseIds.length === selectedExerciseIds.length &&
    completedGeneration.exerciseIds.every((id, index) => id === selectedExerciseIds[index]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    onGeneratingChange(true);
    setCompletedGeneration(null);
    setErrorMessage("");

    try {
      await onGenerateStart();

      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: {
          workoutType,
          exercises: exercises.map(
            ({ id, name, muscle, secondaryMuscles, trackingType, equipment }) => ({
              id,
              name,
              muscle,
              secondaryMuscles,
              trackingType,
              equipment,
            })
          ),
        },
      });

      if (error) throw error;

      const response = typeof data === "string" ? JSON.parse(data) : data;
      if (response?.error) {
        throw new Error(
          typeof response.error === "string" ? response.error : "The workout generation request failed."
        );
      }

      if (!Array.isArray(response?.exercises)) {
        throw new Error("The generated workout response did not contain an exercises list.");
      }

      const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
      const generatedById = new Map();

      response.exercises.forEach((generatedExercise) => {
        if (typeof generatedExercise?.id !== "string") {
          throw new Error("The generated workout contains an exercise without a valid ID.");
        }

        const exercise = exercisesById.get(generatedExercise.id);
        if (!exercise) {
          throw new Error(`The generated workout contains an unknown exercise ID: ${generatedExercise.id}`);
        }

        generatedById.set(exercise.id, exercise);
      });

      if (generatedById.size === 0) {
        throw new Error("The generated workout did not include any exercises from the exercise library.");
      }

      const generatedExercises = [...generatedById.values()];
      onExercisesGenerated(generatedExercises);
      setCompletedGeneration({
        workoutType,
        exerciseIds: generatedExercises.map((exercise) => exercise.id).sort(),
        exerciseCount: generatedExercises.length,
      });
    } catch (error) {
      console.error("Failed to generate workout:", error);
      setErrorMessage(error?.message || "Unable to generate a workout. Please try again.");
    } finally {
      setIsGenerating(false);
      onGeneratingChange(false);
    }
  };

  return (
    <div className="ai-workout-generator">
      <button
        type="button"
        className={`ai-workout-generator__button${isCurrentWorkoutGenerated ? " ai-workout-generator__button--generated" : ""}`}
        onClick={handleGenerate}
        disabled={isGenerating || isCurrentWorkoutGenerated}
        aria-live="polite"
        aria-atomic="true"
      >
        {isGenerating
          ? "Generating workout..."
          : isCurrentWorkoutGenerated
            ? `Workout generated — ${completedGeneration.exerciseCount} ${completedGeneration.exerciseCount === 1 ? "exercise" : "exercises"} added.`
            : `Generate ${WORKOUT_TYPE_LABELS[workoutType] ?? "selected"} workout with AI`}
      </button>
      {errorMessage && (
        <p className="ai-workout-generator__error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GenerateWorkout;
