import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { WORKOUT_STATUS } from "../constants/workoutStatus";
import { WorkoutProvider, useWorkout } from "./WorkoutContext";

const wrapper = ({ children }) => (
  <WorkoutProvider>{children}</WorkoutProvider>
);

describe("WorkoutContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes defaults when there is no saved workout state", async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });

    expect(result.current.status).toBe(WORKOUT_STATUS.IDLE);
    expect(result.current.currentPlan).toBeNull();
    expect(result.current.currentLog).toBeNull();
    expect(result.current.workouts).toEqual([]);
    expect(result.current.weeklyGoal).toBeNull();
    expect(result.current.templates).toEqual([]);

    await waitFor(() => {
      expect(localStorage.getItem("workoutStatus")).toBe(WORKOUT_STATUS.IDLE);
      expect(localStorage.getItem("currentPlan")).toBe("null");
      expect(localStorage.getItem("currentLog")).toBe("null");
      expect(localStorage.getItem("workouts")).toBe("[]");
      expect(localStorage.getItem("weeklyGoal")).toBe("null");
      expect(localStorage.getItem("templates")).toBe("[]");
    });
  });

  it("restores every persisted value from localStorage", () => {
    const savedState = {
      workoutStatus: WORKOUT_STATUS.IN_PROGRESS,
      currentPlan: { date: "2026-10-31", exercises: [{ id: "bench-press" }] },
      currentLog: { exercises: [{ id: "bench-press", sets: [] }], notes: "saved" },
      workouts: [{ id: "workout-1" }],
      weeklyGoal: 4,
      templates: [{ id: "template-1" }],
    };

    localStorage.setItem("workoutStatus", savedState.workoutStatus);
    localStorage.setItem("currentPlan", JSON.stringify(savedState.currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(savedState.currentLog));
    localStorage.setItem("workouts", JSON.stringify(savedState.workouts));
    localStorage.setItem("weeklyGoal", JSON.stringify(savedState.weeklyGoal));
    localStorage.setItem("templates", JSON.stringify(savedState.templates));

    const { result } = renderHook(() => useWorkout(), { wrapper });

    expect(result.current.status).toBe(savedState.workoutStatus);
    expect(result.current.currentPlan).toEqual(savedState.currentPlan);
    expect(result.current.currentLog).toEqual(savedState.currentLog);
    expect(result.current.workouts).toEqual(savedState.workouts);
    expect(result.current.weeklyGoal).toBe(savedState.weeklyGoal);
    expect(result.current.templates).toEqual(savedState.templates);
  });

  it("persists state updates to localStorage", async () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });
    const currentPlan = { date: "2026-10-31", exercises: [{ id: "bench-press" }] };
    const currentLog = { exercises: [{ id: "bench-press", sets: [] }], notes: "training" };
    const workouts = [{ id: "workout-1" }, { id: "workout-2" }];
    const templates = [{ id: "template-1" }];

    act(() => {
      result.current.setStatus(WORKOUT_STATUS.PLANNED);
      result.current.setCurrentPlan(currentPlan);
      result.current.setCurrentLog(currentLog);
      result.current.setWorkouts(workouts);
      result.current.setWeeklyGoal(3);
      result.current.setTemplates(templates);
    });

    await waitFor(() => {
      expect(localStorage.getItem("workoutStatus")).toBe(WORKOUT_STATUS.PLANNED);
      expect(JSON.parse(localStorage.getItem("currentPlan"))).toEqual(currentPlan);
      expect(JSON.parse(localStorage.getItem("currentLog"))).toEqual(currentLog);
      expect(JSON.parse(localStorage.getItem("workouts"))).toEqual(workouts);
      expect(JSON.parse(localStorage.getItem("weeklyGoal"))).toBe(3);
      expect(JSON.parse(localStorage.getItem("templates"))).toEqual(templates);
    });
  });

  it("returns the latest workout and at most the three latest workouts", () => {
    const workouts = [
      { id: "workout-1" },
      { id: "workout-2" },
      { id: "workout-3" },
      { id: "workout-4" },
    ];
    localStorage.setItem("workouts", JSON.stringify(workouts));

    const { result } = renderHook(() => useWorkout(), { wrapper });

    expect(result.current.getLatestWorkout()).toBe(result.current.workouts[0]);
    expect(result.current.getLatestWorkouts()).toEqual(result.current.workouts.slice(0, 3));
    expect(result.current.getLatestWorkouts()).not.toBe(result.current.workouts);
  });

  it("returns null and an empty list when there are no workouts", () => {
    const { result } = renderHook(() => useWorkout(), { wrapper });

    expect(result.current.getLatestWorkout()).toBeNull();
    expect(result.current.getLatestWorkouts()).toEqual([]);
  });

  it("resets all workout state and persists the reset values", async () => {
    localStorage.setItem("workoutStatus", WORKOUT_STATUS.COMPLETE);
    localStorage.setItem("currentPlan", JSON.stringify({ exercises: [{ id: "bench-press" }] }));
    localStorage.setItem("currentLog", JSON.stringify({ exercises: [{ id: "bench-press" }] }));
    localStorage.setItem("workouts", JSON.stringify([{ id: "workout-1" }]));
    localStorage.setItem("weeklyGoal", JSON.stringify(4));
    localStorage.setItem("templates", JSON.stringify([{ id: "template-1" }]));

    const { result } = renderHook(() => useWorkout(), { wrapper });

    act(() => {
      result.current.resetWorkoutData();
    });

    expect(result.current.status).toBe(WORKOUT_STATUS.IDLE);
    expect(result.current.currentPlan).toBeNull();
    expect(result.current.currentLog).toBeNull();
    expect(result.current.workouts).toEqual([]);
    expect(result.current.weeklyGoal).toBeNull();
    expect(result.current.templates).toEqual([]);

    await waitFor(() => {
      expect(localStorage.getItem("workoutStatus")).toBe(WORKOUT_STATUS.IDLE);
      expect(localStorage.getItem("currentPlan")).toBe("null");
      expect(localStorage.getItem("currentLog")).toBe("null");
      expect(localStorage.getItem("workouts")).toBe("[]");
      expect(localStorage.getItem("weeklyGoal")).toBe("null");
      expect(localStorage.getItem("templates")).toBe("[]");
    });
  });
});
