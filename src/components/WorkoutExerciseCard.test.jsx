import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import WorkoutExerciseCard from "./WorkoutExerciseCard";

afterEach(cleanup);

describe("WorkoutExerciseCard", () => {
  it("renders minutes and seconds inputs for timed exercises", () => {
    render(
      <MemoryRouter>
        <WorkoutExerciseCard
          exercise={{
            id: "plank",
            name: "Plank",
            trackingType: "time",
            sets: [],
            newMinutes: "",
            newSeconds: "",
            newWeight: "",
          }}
          onInputChange={vi.fn()}
          onAddSet={vi.fn()}
          onCopyLastSet={vi.fn()}
          onRemoveSet={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Minutes")).toBeTruthy();
    expect(screen.getByLabelText("Seconds")).toBeTruthy();
    expect(screen.getByPlaceholderText("Weight (kg)")).toBeTruthy();
    expect(screen.queryByLabelText("Reps")).toBeNull();
  });

  it("submits a set for a timed exercise", () => {
    const onAddSet = vi.fn();
    render(
      <MemoryRouter>
        <WorkoutExerciseCard
          exercise={{
            id: "plank",
            name: "Plank",
            trackingType: "time",
            sets: [],
            newMinutes: "1",
            newSeconds: "30",
            newWeight: "",
          }}
          onInputChange={vi.fn()}
          onAddSet={onAddSet}
          onCopyLastSet={vi.fn()}
          onRemoveSet={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Add Set" }));

    expect(onAddSet).toHaveBeenCalledWith("plank");
  });

  it("shows logged timed sets as minutes and seconds", () => {
    render(
      <MemoryRouter>
        <WorkoutExerciseCard
          exercise={{
            id: "plank",
            name: "Plank",
            trackingType: "time",
            sets: [{ seconds: 90, weight: "0" }],
            newMinutes: "",
            newSeconds: "",
            newWeight: "",
          }}
          onInputChange={vi.fn()}
          onAddSet={vi.fn()}
          onCopyLastSet={vi.fn()}
          onRemoveSet={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Duration")).toBeTruthy();
    expect(screen.getByText("1:30")).toBeTruthy();
  });

  it("continues to render the reps input for rep-tracked exercises", () => {
    render(
      <MemoryRouter>
        <WorkoutExerciseCard
          exercise={{
            id: "bench-press",
            name: "Barbell Bench Press",
            trackingType: "reps",
            sets: [],
            newReps: "",
            newWeight: "",
          }}
          onInputChange={vi.fn()}
          onAddSet={vi.fn()}
          onCopyLastSet={vi.fn()}
          onRemoveSet={vi.fn()}
        />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Reps")).toBeTruthy();
    expect(screen.queryByLabelText("Minutes")).toBeNull();
  });
});
