import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthentication } from "../context/AuthenticationContext";
import { useWorkout } from "../context/WorkoutContext";
import exerciseList from "../data/exercises.json";
import {
  clearCurrentPlan,
  fetchPersonalBests,
  fetchWorkouts,
  insertWorkout,
} from "../supabase/supabaseWorkoutService";
import { handleSupabaseAuthError } from "../utils/authErrorHandler";
import { getCurrentPBs, getLatestPersonalBests } from "../utils/pbUtils";
import type { PersonalBest, PersonalBestRecord } from "../utils/pbUtils";
import { hydrateExercises } from "../utils/exerciseUtils";

type ExerciseDefinition = (typeof exerciseList)[number];
type WorkoutStatus = "idle" | "planning" | "planned" | "inProgress" | "complete";
type WorkoutSet = {
  reps?: string | number;
  weight?: string | number;
  seconds?: number;
};
type WorkoutExercise = {
  id: string;
  sets?: WorkoutSet[];
};
type LoggedExercise = ExerciseDefinition & WorkoutExercise & {
  sets: WorkoutSet[];
  newReps: string;
  newMinutes: string;
  newSeconds: string;
  newWeight: string;
};
type PlannedExercise = {
  id: string;
  sets?: WorkoutSet[];
};
type WorkoutPlan = {
  date: string;
  type: string;
  exercises: PlannedExercise[];
  startedAt?: string;
};
type WorkoutLog = {
  startedAt?: string;
  exercises: LoggedExercise[];
  notes: string;
};
type WorkoutRecord = {
  id?: string;
  date: string;
  type: string;
  exercises: WorkoutExercise[];
  personalBests?: PersonalBestRecord;
  completedAt?: string | null;
  notes?: string | null;
};
type WorkoutState = {
  status: WorkoutStatus;
  setStatus: Dispatch<SetStateAction<WorkoutStatus>>;
  currentPlan: WorkoutPlan | null;
  setCurrentPlan: Dispatch<SetStateAction<WorkoutPlan | null>>;
  currentLog: WorkoutLog | null;
  setCurrentLog: Dispatch<SetStateAction<WorkoutLog | null>>;
  setWorkouts: Dispatch<SetStateAction<WorkoutRecord[]>>;
  personalBests: PersonalBest[];
  setPersonalBests: Dispatch<SetStateAction<PersonalBest[]>>;
};
type AuthenticationState = {
  user: { id: string } | null;
  logout: () => Promise<void>;
};
type InputField = "newReps" | "newMinutes" | "newSeconds" | "newWeight";

const calculateNewPersonalBests = (
  completedWorkout: WorkoutRecord,
  savedPersonalBests: PersonalBest[],
): PersonalBestRecord => {
  const workoutPBs = getCurrentPBs([completedWorkout]);
  const latestPersonalBests = getLatestPersonalBests(savedPersonalBests);

  const newPBs: PersonalBestRecord = {};
  for (const [id, candidate] of Object.entries(workoutPBs)) {
    const previous = latestPersonalBests[id];
    const isNewTimedPB = candidate.trackingType === "time" &&
      (
        !previous ||
        (candidate.seconds ?? 0) > (previous.seconds ?? 0) ||
        (candidate.seconds === previous.seconds && (candidate.weight || 0) > (previous.weight || 0))
      );
    const isNewRepPB = candidate.trackingType !== "time" && (
      !previous ||
      (candidate.weight ?? 0) > (previous.weight ?? 0) ||
      (candidate.weight === previous.weight && (candidate.reps ?? 0) > (previous.reps ?? 0))
    );
    if (isNewTimedPB || isNewRepPB) {
      newPBs[id] = candidate;
    }
  }
  return newPBs;
};

const isValidInput = (value: string): boolean => {
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
    setWorkouts,
    personalBests,
    setPersonalBests,
  } = useWorkout() as WorkoutState;
  const { user, logout } = useAuthentication() as AuthenticationState;
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentLog && currentPlan?.exercises && status === "inProgress") {
      const hydratedExercises = hydrateExercises(currentPlan.exercises) as ExerciseDefinition[];
      const initialisedLog: WorkoutLog = {
        startedAt: currentPlan.startedAt ?? new Date().toISOString(),
        exercises: hydratedExercises.map((exercise) => ({
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
    } else if (currentLog && !currentLog.startedAt) {
      setCurrentLog((previousLog) => previousLog
        ? { ...previousLog, startedAt: currentPlan?.startedAt ?? new Date().toISOString() }
        : previousLog);
    }
  }, [currentLog, currentPlan, setCurrentLog, status]);

  const availableExercises = (currentLog
    ? exerciseList.filter((exercise) => !currentLog.exercises.some((logExercise) => logExercise.id === exercise.id))
    : exerciseList
  ).sort((first, second) => first.name.localeCompare(second.name));

  const handleInputChange = useCallback((id: string, field: InputField, value: string) => {
    setCurrentLog((previousLog) => previousLog
      ? {
        ...previousLog,
        exercises: previousLog.exercises.map((exercise) =>
          exercise.id === id ? { ...exercise, [field]: value } : exercise
        ),
      }
      : previousLog);
  }, [setCurrentLog]);

  const addSet = useCallback((id: string) => {
    setCurrentLog((previousLog) => previousLog
      ? {
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
          const set: WorkoutSet = isTimedExercise
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
      }
      : previousLog);
  }, [setCurrentLog]);

  const copyLastSet = useCallback((exerciseId: string) => {
    setCurrentLog((previousLog) => previousLog
      ? {
        ...previousLog,
        exercises: previousLog.exercises.map((exercise) => {
          if (exercise.id !== exerciseId || exercise.sets.length === 0) return exercise;
          const lastSet = exercise.sets[exercise.sets.length - 1];

          return {
            ...exercise,
            sets: [...exercise.sets, { ...lastSet }],
          };
        }),
      }
      : previousLog);
  }, [setCurrentLog]);

  const removeSet = useCallback((exerciseId: string, setIndex: number) => {
    setCurrentLog((previousLog) => previousLog
      ? {
        ...previousLog,
        exercises: previousLog.exercises.map((exercise) => {
          if (exercise.id !== exerciseId) return exercise;
          return { ...exercise, sets: exercise.sets.filter((_, index) => index !== setIndex) };
        }),
      }
      : previousLog);
  }, [setCurrentLog]);

  const addExercise = (exerciseId: string) => {
    if (!exerciseId) return;
    const exerciseToAdd = exerciseList.find((exercise) => exercise.id === exerciseId);
    if (!exerciseToAdd) return;

    setCurrentLog((previousLog) => previousLog
      ? {
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
      }
      : previousLog);
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
    if (isSubmittingRef.current || !currentPlan || !currentLog) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    const rawCompletedWorkout: WorkoutRecord = {
      ...currentPlan,
      exercises: currentLog.exercises.filter((exercise) => exercise.sets.length > 0),
      completedAt: new Date().toISOString(),
      notes: currentLog.notes,
    };
    rawCompletedWorkout.personalBests = calculateNewPersonalBests(
      rawCompletedWorkout,
      personalBests ?? {},
    );

    try {
      if (!user?.id) throw new Error("You must be signed in to save a workout.");
      const savedWorkout = await insertWorkout(user.id, rawCompletedWorkout);
      const fetchedWorkouts = await fetchWorkouts(user.id);
      const fetchedPersonalBests = await fetchPersonalBests(user.id);
      await clearCurrentPlan(user.id);

      setWorkouts(fetchedWorkouts);
      setPersonalBests(fetchedPersonalBests);
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

  const updateNotes = (notes: string) => {
    setCurrentLog((previousLog) => previousLog ? { ...previousLog, notes } : previousLog);
  };

  const hasAnySets = currentLog?.exercises.some((exercise) => exercise.sets.length > 0) ?? false;

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
