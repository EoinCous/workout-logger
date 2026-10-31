import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { useAuthentication } from "../context/AuthenticationContext";
import { useWorkout } from "../context/WorkoutContext";
import {
  clearCurrentPlan,
  fetchWorkouts,
  insertWorkout,
} from "../supabase/supabaseWorkoutService";
import { handleSupabaseAuthError } from "../utils/authErrorHandler";
import useWorkoutLog from "./useWorkoutLog";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../context/AuthenticationContext", () => ({
  useAuthentication: vi.fn(),
}));

vi.mock("../context/WorkoutContext", () => ({
  useWorkout: vi.fn(),
}));

vi.mock("../supabase/supabaseWorkoutService", () => ({
  clearCurrentPlan: vi.fn(),
  fetchWorkouts: vi.fn(),
  insertWorkout: vi.fn(),
}));

vi.mock("../utils/authErrorHandler", () => ({
  handleSupabaseAuthError: vi.fn(),
}));

const benchPress = {
  id: "bench-press",
  name: "Barbell Bench Press",
  sets: [],
  newReps: "",
  newWeight: "",
};

const makeLog = (exercises = [benchPress]) => ({
  exercises: exercises.map((exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set) => ({ ...set })),
  })),
  notes: "",
});

let initialWorkoutState;

describe("useWorkoutLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initialWorkoutState = {
      status: "inProgress",
      currentPlan: {
        date: "2026-10-31",
        type: "strength",
        exercises: [benchPress],
      },
      currentLog: makeLog(),
      workouts: [],
    };

    useWorkout.mockImplementation(function useWorkoutMock() {
      const [status, setStatus] = useState(initialWorkoutState.status);
      const [currentPlan, setCurrentPlan] = useState(initialWorkoutState.currentPlan);
      const [currentLog, setCurrentLog] = useState(initialWorkoutState.currentLog);
      const [workouts, setWorkouts] = useState(initialWorkoutState.workouts);

      return {
        status,
        setStatus,
        currentPlan,
        setCurrentPlan,
        currentLog,
        setCurrentLog,
        workouts,
        setWorkouts,
      };
    });
    useAuthentication.mockReturnValue({
      user: { id: "user-1" },
      logout: vi.fn(),
    });
    insertWorkout.mockResolvedValue({ id: "saved-workout" });
    fetchWorkouts.mockResolvedValue([]);
    clearCurrentPlan.mockResolvedValue(undefined);
  });

  it("converts timed set minutes and seconds to total seconds", () => {
    initialWorkoutState.currentLog = makeLog([{
      id: "plank",
      name: "Plank",
      trackingType: "time",
      sets: [],
    }]);
    const { result } = renderHook(() => useWorkoutLog());

    act(() => {
      result.current.handleInputChange("plank", "newMinutes", "1");
      result.current.handleInputChange("plank", "newSeconds", "30");
      result.current.handleInputChange("plank", "newWeight", "invalid");
    });
    act(() => {
      result.current.addSet("plank");
    });

    expect(result.current.currentLog.exercises[0]).toMatchObject({
      sets: [{ weight: "0", seconds: 90 }],
      newMinutes: "",
      newSeconds: "",
      newWeight: "",
    });
  });

  it("does not add timed sets with invalid or zero duration", () => {
    initialWorkoutState.currentLog = makeLog([{
      id: "plank",
      name: "Plank",
      trackingType: "time",
      sets: [],
    }]);
    const { result } = renderHook(() => useWorkoutLog());

    for (const [minutes, seconds] of [
      ["", ""],
      ["0", "0"],
      ["-1", "10"],
      ["1.5", "0"],
      ["invalid", "10"],
    ]) {
      act(() => {
        result.current.handleInputChange("plank", "newMinutes", minutes);
        result.current.handleInputChange("plank", "newSeconds", seconds);
      });
      act(() => {
        result.current.addSet("plank");
      });
      expect(result.current.currentLog.exercises[0].sets).toEqual([]);
    }
  });

  it("initializes a log from the active plan when one does not exist", async () => {
    initialWorkoutState.currentLog = null;

    const { result } = renderHook(() => useWorkoutLog());

    await waitFor(() => {
      expect(result.current.currentLog).toMatchObject({
        exercises: [{
          ...benchPress,
          sets: [],
          newReps: "",
          newMinutes: "",
          newSeconds: "",
          newWeight: "",
        }],
        notes: "",
      });
    });
  });

  it("hydrates restored plans with exercise tracking types", async () => {
    initialWorkoutState.currentPlan.exercises = [{ id: "plank", sets: [] }];
    initialWorkoutState.currentLog = null;

    const { result } = renderHook(() => useWorkoutLog());

    await waitFor(() => {
      expect(result.current.currentLog.exercises[0]).toMatchObject({
        id: "plank",
        trackingType: "time",
        newMinutes: "",
        newSeconds: "",
      });
    });
  });

  it("sorts available exercises and excludes exercises already in the log", () => {
    const { result } = renderHook(() => useWorkoutLog());

    expect(result.current.availableExercises.some((exercise) => exercise.id === "bench-press")).toBe(false);
    expect(result.current.availableExercises.map((exercise) => exercise.name)).toEqual(
      [...result.current.availableExercises]
        .map((exercise) => exercise.name)
        .sort((first, second) => first.localeCompare(second))
    );
  });

  it("adds a set only for valid reps and defaults an invalid weight to zero", () => {
    const { result } = renderHook(() => useWorkoutLog());

    for (const reps of ["", "abc", "-1"]) {
      act(() => {
        result.current.handleInputChange("bench-press", "newReps", reps);
      });
      act(() => {
        result.current.addSet("bench-press");
      });
      expect(result.current.currentLog.exercises[0].sets).toEqual([]);
    }

    act(() => {
      result.current.handleInputChange("bench-press", "newReps", "8");
      result.current.handleInputChange("bench-press", "newWeight", "invalid");
    });
    act(() => {
      result.current.addSet("bench-press");
    });

    expect(result.current.currentLog.exercises[0]).toMatchObject({
      sets: [{ reps: "8", weight: "0" }],
      newReps: "",
      newMinutes: "",
      newSeconds: "",
      newWeight: "",
    });
    expect(result.current.hasAnySets).toBe(true);
  });

  it("copies the last set and removes the requested set", () => {
    initialWorkoutState.currentLog = makeLog([{
      ...benchPress,
      sets: [{ reps: "8", weight: "80" }, { reps: "6", weight: "85" }],
    }]);
    const { result } = renderHook(() => useWorkoutLog());

    act(() => {
      result.current.copyLastSet("bench-press");
    });
    expect(result.current.currentLog.exercises[0].sets).toEqual([
      { reps: "8", weight: "80" },
      { reps: "6", weight: "85" },
      { reps: "6", weight: "85" },
    ]);

    act(() => {
      result.current.removeSet("bench-press", 1);
    });
    expect(result.current.currentLog.exercises[0].sets).toEqual([
      { reps: "8", weight: "80" },
      { reps: "6", weight: "85" },
    ]);
  });

  it("copies time set data without converting it to reps", () => {
    initialWorkoutState.currentLog = makeLog([{
      id: "plank",
      name: "Plank",
      trackingType: "time",
      sets: [{ seconds: 90, weight: "0" }],
    }]);
    const { result } = renderHook(() => useWorkoutLog());

    act(() => {
      result.current.copyLastSet("plank");
    });

    expect(result.current.currentLog.exercises[0].sets).toEqual([
      { seconds: 90, weight: "0" },
      { seconds: 90, weight: "0" },
    ]);
  });

  it("adds an exercise and clears the selected exercise", () => {
    const { result } = renderHook(() => useWorkoutLog());

    act(() => {
      result.current.setSelectedExerciseId("lat-pulldown");
      result.current.addExercise("lat-pulldown");
    });

    expect(result.current.currentLog.exercises.map((exercise) => exercise.id)).toEqual([
      "bench-press",
      "lat-pulldown",
    ]);
    expect(result.current.currentLog.exercises[1].sets).toEqual([]);
    expect(result.current.selectedExerciseId).toBe("");
  });

  it("updates notes and cancels only after confirmation", () => {
    const { result } = renderHook(() => useWorkoutLog());
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

    act(() => {
      result.current.updateNotes("Felt strong");
      result.current.cancelWorkout();
    });

    expect(result.current.currentLog.notes).toBe("Felt strong");
    expect(result.current.currentPlan).not.toBeNull();
    expect(mocks.navigate).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    act(() => {
      result.current.cancelWorkout();
    });

    expect(result.current.currentPlan).not.toBeNull();
    expect(result.current.currentLog).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith("/workout");
  });

  it("saves a completed workout once, records new personal bests, and clears the plan", async () => {
    const previousWorkout = {
      date: "2026-10-30",
      exercises: [{
        id: "bench-press",
        sets: [{ reps: "8", weight: "80" }],
      }],
    };
    initialWorkoutState.workouts = [previousWorkout];
    initialWorkoutState.currentLog = {
      exercises: [
        { ...benchPress, sets: [{ reps: "8", weight: "82" }] },
        { id: "lat-pulldown", sets: [] },
      ],
      notes: "New best",
    };
    const savedWorkout = { id: "saved-workout" };
    const fetchedWorkouts = [{ id: "latest-workout" }];
    let resolveInsert;
    insertWorkout.mockReturnValue(new Promise((resolve) => {
      resolveInsert = resolve;
    }));
    fetchWorkouts.mockResolvedValue(fetchedWorkouts);

    const { result } = renderHook(() => useWorkoutLog());
    let completion;

    await act(async () => {
      completion = result.current.completeWorkout();
      await Promise.resolve();
      await result.current.completeWorkout();
    });

    expect(result.current.isSubmitting).toBe(true);
    expect(insertWorkout).toHaveBeenCalledTimes(1);
    const submittedWorkout = insertWorkout.mock.calls[0][1];
    expect(submittedWorkout.exercises).toHaveLength(1);
    expect(submittedWorkout.notes).toBe("New best");
    expect(submittedWorkout.personalBests["bench-press"]).toMatchObject({
      exerciseId: "bench-press",
      weight: 82,
      reps: 8,
    });

    await act(async () => {
      resolveInsert(savedWorkout);
      await completion;
    });

    expect(fetchWorkouts).toHaveBeenCalledWith("user-1");
    expect(clearCurrentPlan).toHaveBeenCalledWith("user-1");
    expect(result.current.currentPlan).toBeNull();
    expect(result.current.currentLog).toBeNull();
    expect(result.current.isSubmitting).toBe(true);
    expect(mocks.navigate).toHaveBeenCalledWith("/workout-summary", {
      state: { workout: fetchedWorkouts[0] },
    });
  });

  it("records a timed personal best when completing a workout", async () => {
    initialWorkoutState.currentLog = {
      exercises: [{
        id: "plank",
        name: "Plank",
        trackingType: "time",
        sets: [{ weight: "0", seconds: 90 }],
      }],
      notes: "",
    };

    const { result } = renderHook(() => useWorkoutLog());

    await act(async () => {
      await result.current.completeWorkout();
    });

    expect(insertWorkout.mock.calls[0][1].personalBests.plank).toMatchObject({
      exerciseId: "plank",
      trackingType: "time",
      seconds: 90,
    });
  });

  it("reports save failures and resets the submitting state", async () => {
    const error = new Error("Save failed");
    insertWorkout.mockRejectedValue(error);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useWorkoutLog());

    await act(async () => {
      await result.current.completeWorkout();
    });

    expect(handleSupabaseAuthError).toHaveBeenCalledWith(error, expect.any(Function));
    expect(alert).toHaveBeenCalledWith("Check your internet connection. Workout couldn't be saved.");
    expect(result.current.isSubmitting).toBe(false);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
