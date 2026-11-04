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
  onExercisesGenerated,
  onGeneratingChange,
  onGenerateStart,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    onGeneratingChange(true);
    setMessage("");
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

      onExercisesGenerated([...generatedById.values()]);
      setMessage("Your AI workout is ready. Review the selected exercises below.");
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
        className="ai-workout-generator__button"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating
          ? "Generating workout..."
          : `Generate ${WORKOUT_TYPE_LABELS[workoutType] ?? "selected"} workout with AI`}
      </button>
      {message && (
        <p className="ai-workout-generator__message" role="status">
          {message}
        </p>
      )}
      {errorMessage && (
        <p className="ai-workout-generator__error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GenerateWorkout;
