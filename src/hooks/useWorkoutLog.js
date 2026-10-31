import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "../context/AuthenticationContext";
import { useWorkout } from "../context/WorkoutContext";
import exerciseList from "../data/exercises.json";
import { clearCurrentPlan, fetchWorkouts, insertWorkout } from "../supabase/supabaseWorkoutService";
import { handleSupabaseAuthError } from "../utils/authErrorHandler";
import { getCurrentPBs } from "../utils/pbUtils";
import { hydrateExercises } from "../utils/exerciseUtils";

const calculateNewPersonalBests = (previousWorkouts, completedWorkout) => {
  const previousPBs = getCurrentPBs(previousWorkouts);
  const updatedPBs = getCurrentPBs([...previousWorkouts, completedWorkout]);

  const newPBs = {};
  for (const [id, updated] of Object.entries(updatedPBs)) {
    const previous = previousPBs[id];
    const isNewTimedPB = updated.trackingType === "time" &&
      (
        !previous ||
        updated.seconds > previous.seconds ||
        (updated.seconds === previous.seconds && (updated.weight || 0) > (previous.weight || 0))
      );
    const isNewRepPB = updated.trackingType !== "time" && (
      !previous ||
      updated.weight > previous.weight ||
      (updated.weight === previous.weight && updated.reps > previous.reps)
    );
    if (isNewTimedPB || isNewRepPB) {
      newPBs[id] = updated;
    }
  }
  return newPBs;
};

const isValidInput = (value) => {
  if (value === "") return false;
  const number = Number(value);
  return !Number.isNaN(number) && number >= 0;
};

const useWorkoutLog = () => {
  const {
    status,
    setStatus,
    currentPlan,
    setCurrentPlan,
    currentLog,
    setCurrentLog,
    workouts,
    setWorkouts,
  } = useWorkout();
  const { user, logout } = useAuthentication();
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentLog && currentPlan?.exercises && status === "inProgress") {
      const initialisedLog = {
        exercises: hydrateExercises(currentPlan.exercises).map((exercise) => ({
          ...exercise,
          sets: [],
          newReps: "",
          newMinutes: "",
          newSeconds: "",
          newWeight: "",
        })),
        notes: "",
      };
      setCurrentLog(initialisedLog);
    }
  }, [currentLog, currentPlan, setCurrentLog, status]);

  const availableExercises = (currentLog
    ? exerciseList.filter((exercise) => !currentLog.exercises.some((logExercise) => logExercise.id === exercise.id))
    : exerciseList
  ).sort((first, second) => first.name.localeCompare(second.name));

  const handleInputChange = useCallback((id, field, value) => {
    setCurrentLog((previousLog) => ({
      ...previousLog,
      exercises: previousLog.exercises.map((exercise) =>
        exercise.id === id ? { ...exercise, [field]: value } : exercise
      ),
    }));
  }, [setCurrentLog]);

  const addSet = useCallback((id) => {
    setCurrentLog((previousLog) => ({
      ...previousLog,
      exercises: previousLog.exercises.map((exercise) => {
        if (exercise.id !== id) return exercise;

        const { newReps, newMinutes, newSeconds, newWeight, sets } = exercise;
        const isTimedExercise = exercise.trackingType === "time";
        const minuteInput = newMinutes ?? "";
        const secondInput = newSeconds ?? "";
        const minutes = minuteInput === "" ? 0 : Number(minuteInput);
        const seconds = secondInput === "" ? 0 : Number(secondInput);
        const isValidDurationInput =
          [minuteInput, secondInput].some((value) => value !== "") &&
          [minutes, seconds].every((value) => Number.isInteger(value) && value >= 0) &&
          minutes * 60 + seconds > 0;
        if (isTimedExercise ? !isValidDurationInput : !isValidInput(newReps)) return exercise;
        const validWeight = isValidInput(newWeight) ? newWeight : "0";
        const set = isTimedExercise
          ? { weight: validWeight, seconds: minutes * 60 + seconds }
          : { reps: newReps, weight: validWeight };

        return {
          ...exercise,
          sets: [...sets, set],
          newReps: "",
          newMinutes: "",
          newSeconds: "",
          newWeight: "",
        };
      }),
    }));
  }, [setCurrentLog]);

  const copyLastSet = useCallback((exerciseId) => {
    setCurrentLog((previousLog) => ({
      ...previousLog,
      exercises: previousLog.exercises.map((exercise) => {
        if (exercise.id !== exerciseId || exercise.sets.length === 0) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];

        return {
          ...exercise,
          sets: [...exercise.sets, { ...lastSet }],
        };
      }),
    }));
  }, [setCurrentLog]);

  const removeSet = useCallback((exerciseId, setIndex) => {
    setCurrentLog((previousLog) => ({
      ...previousLog,
      exercises: previousLog.exercises.map((exercise) => {
        if (exercise.id !== exerciseId) return exercise;
        return { ...exercise, sets: exercise.sets.filter((_, index) => index !== setIndex) };
      }),
    }));
  }, [setCurrentLog]);

  const addExercise = (exerciseId) => {
    if (!exerciseId) return;
    const exerciseToAdd = exerciseList.find((exercise) => exercise.id === exerciseId);
    if (!exerciseToAdd) return;

    setCurrentLog((previousLog) => ({
      ...previousLog,
      exercises: [
        ...previousLog.exercises,
        {
          ...exerciseToAdd,
          sets: [],
          newReps: "",
          newMinutes: "",
          newSeconds: "",
          newWeight: "",
        },
      ],
    }));
    setSelectedExerciseId("");
  };

  const cancelWorkout = () => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this workout? All current progress will be lost.");
    if (!confirmCancel) return;

    setStatus("idle");
    setCurrentLog(null);
    navigate("/workout");
  };

  const completeWorkout = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const rawCompletedWorkout = {
      ...currentPlan,
      exercises: currentLog.exercises.filter((exercise) => exercise.sets.length > 0),
      completedAt: new Date().toISOString(),
      notes: currentLog.notes,
    };
    rawCompletedWorkout.personalBests = calculateNewPersonalBests(workouts, rawCompletedWorkout);

    try {
      const savedWorkout = await insertWorkout(user?.id, rawCompletedWorkout);
      const fetchedWorkouts = await fetchWorkouts(user?.id);
      await clearCurrentPlan(user?.id);

      setWorkouts(fetchedWorkouts);
      setCurrentPlan(null);
      setStatus("complete");
      setCurrentLog(null);

      const finalWorkoutToPass = fetchedWorkouts[0] || savedWorkout || rawCompletedWorkout;
      navigate("/workout-summary", { state: { workout: finalWorkoutToPass } });
    } catch (error) {
      handleSupabaseAuthError(error, logout);
      console.error("Failed to complete workout:", error);
      alert("Check your internet connection. Workout couldn't be saved.");

      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const updateNotes = (notes) => {
    setCurrentLog((previousLog) => ({ ...previousLog, notes }));
  };

  const hasAnySets = currentLog?.exercises?.some((exercise) => exercise.sets.length > 0) ?? false;

  return {
    currentLog,
    currentPlan,
    selectedExerciseId,
    setSelectedExerciseId,
    isSubmitting,
    availableExercises,
    handleInputChange,
    addSet,
    copyLastSet,
    removeSet,
    addExercise,
    cancelWorkout,
    completeWorkout,
    updateNotes,
    hasAnySets,
  };
};

export default useWorkoutLog;
