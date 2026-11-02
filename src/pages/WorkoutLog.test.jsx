import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WorkoutLog from "./WorkoutLog";

const mocks = vi.hoisted(() => ({
  useWorkoutLog: vi.fn(),
}));

vi.mock("../hooks/useWorkoutLog", () => ({
  default: mocks.useWorkoutLog,
}));

describe("WorkoutLog", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T20:00:00.000Z"));
    mocks.useWorkoutLog.mockReturnValue({
      currentLog: {
        startedAt: "2026-11-02T20:00:00.000Z",
        exercises: [],
        notes: "",
      },
      currentPlan: { type: "strength" },
      selectedExerciseId: "",
      setSelectedExerciseId: vi.fn(),
      isSubmitting: false,
      availableExercises: [],
      handleInputChange: vi.fn(),
      addSet: vi.fn(),
      copyLastSet: vi.fn(),
      removeSet: vi.fn(),
      addExercise: vi.fn(),
      cancelWorkout: vi.fn(),
      completeWorkout: vi.fn(),
      updateNotes: vi.fn(),
      hasAnySets: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows elapsed time from the workout start and updates live", () => {
    render(<WorkoutLog />);

    expect(screen.getByRole("timer").textContent).toBe("00:00:00");

    act(() => {
      vi.advanceTimersByTime(65_000);
    });

    expect(screen.getByRole("timer").textContent).toBe("00:01:05");
  });
});
