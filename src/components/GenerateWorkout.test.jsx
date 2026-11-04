import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("../supabase/supabaseClient", () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

import GenerateWorkout from "./GenerateWorkout";

const exercises = [
  {
    id: "bench-press",
    name: "Barbell Bench Press",
    muscle: "chest",
    secondaryMuscles: ["triceps", "shoulders"],
    trackingType: "reps",
    equipment: "Barbell",
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscle: "lats",
    secondaryMuscles: ["biceps"],
    trackingType: "reps",
    equipment: "Cable Machine",
  },
];

const defaultProps = {
  workoutType: "push",
  exercises,
  selectedExercises: [],
  onExercisesGenerated: vi.fn(),
  onGeneratingChange: vi.fn(),
  onGenerateStart: vi.fn().mockResolvedValue(undefined),
};

const renderGenerator = (props = {}) =>
  render(<GenerateWorkout {...defaultProps} {...props} />);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GenerateWorkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoke.mockResolvedValue({
      data: { exercises: [{ id: "bench-press" }] },
      error: null,
    });
    defaultProps.onGenerateStart.mockResolvedValue(undefined);
  });

  it("sends the selected workout type and exercise catalog to the edge function", async () => {
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: "Generate Push workout with AI" }));

    await waitFor(() => {
      expect(mocks.invoke).toHaveBeenCalledWith("generate-workout", {
        body: { workoutType: "push", exercises },
      });
    });
  });

  it("adds generated catalog exercises and disables the button until the workout changes", async () => {
    const onExercisesGenerated = vi.fn();
    const { rerender } = render(
      <GenerateWorkout {...defaultProps} onExercisesGenerated={onExercisesGenerated} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Generate Push workout with AI" }));

    await waitFor(() => {
      expect(onExercisesGenerated).toHaveBeenCalledWith([exercises[0]]);
    });
    rerender(
      <GenerateWorkout
        {...defaultProps}
        selectedExercises={[exercises[0]]}
        onExercisesGenerated={onExercisesGenerated}
      />
    );
    const generatedButton = await screen.findByRole("button", {
      name: "Workout generated — 1 exercise added.",
    });
    expect(generatedButton.disabled).toBe(true);

    rerender(
      <GenerateWorkout {...defaultProps} selectedExercises={[exercises[0]]} onExercisesGenerated={onExercisesGenerated} />
    );
    expect(screen.getByRole("button", { name: "Workout generated — 1 exercise added." }).disabled).toBe(true);

    rerender(
      <GenerateWorkout
        {...defaultProps}
        selectedExercises={exercises}
        onExercisesGenerated={onExercisesGenerated}
      />
    );
    expect(screen.getByRole("button", { name: "Generate Push workout with AI" }).disabled).toBe(false);

    rerender(
      <GenerateWorkout
        {...defaultProps}
        workoutType="pull"
        selectedExercises={[]}
        onExercisesGenerated={onExercisesGenerated}
      />
    );
    expect(screen.getByRole("button", { name: "Generate Pull workout with AI" }).disabled).toBe(false);
  });

  it("shows a loading label and prevents another request while generating", async () => {
    let resolveInvoke;
    mocks.invoke.mockReturnValue(new Promise((resolve) => {
      resolveInvoke = resolve;
    }));
    const { rerender } = renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: "Generate Push workout with AI" }));

    const button = screen.getByRole("button", { name: "Generating workout..." });
    expect(button.disabled).toBe(true);
    expect(defaultProps.onGeneratingChange).toHaveBeenNthCalledWith(1, true);

    resolveInvoke({ data: { exercises: [{ id: "bench-press" }] }, error: null });
    await waitFor(() => {
      expect(defaultProps.onExercisesGenerated).toHaveBeenCalledWith([exercises[0]]);
    });
    rerender(
      <GenerateWorkout {...defaultProps} selectedExercises={[exercises[0]]} />
    );
    await screen.findByRole("button", { name: "Workout generated — 1 exercise added." });
    expect(defaultProps.onGeneratingChange).toHaveBeenLastCalledWith(false);
  });

  it("shows an error and re-enables generation when the edge function fails", async () => {
    mocks.invoke.mockResolvedValue({
      data: null,
      error: new Error("Generation service unavailable"),
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: "Generate Push workout with AI" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "Generation service unavailable"
    );
    expect(screen.getByRole("button", { name: "Generate Push workout with AI" }).disabled).toBe(false);
    expect(defaultProps.onExercisesGenerated).not.toHaveBeenCalled();
  });

  it("rejects generated exercise IDs that are not in the catalog", async () => {
    mocks.invoke.mockResolvedValue({
      data: { exercises: [{ id: "unknown-exercise" }] },
      error: null,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: "Generate Push workout with AI" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "unknown exercise ID: unknown-exercise"
    );
    expect(defaultProps.onExercisesGenerated).not.toHaveBeenCalled();
  });

  it("does not call the edge function if clearing the current plan fails", async () => {
    defaultProps.onGenerateStart.mockRejectedValue(new Error("Unable to clear the current plan"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderGenerator();

    fireEvent.click(screen.getByRole("button", { name: "Generate Push workout with AI" }));

    expect((await screen.findByRole("alert")).textContent).toBe("Unable to clear the current plan");
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(defaultProps.onGeneratingChange).toHaveBeenLastCalledWith(false);
  });
});
