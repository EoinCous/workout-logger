import { describe, expect, it } from "vitest";
import exercisesData from "../data/exercises.json";
import { hydrateExercises } from "./exerciseUtils";

describe("hydrateExercises", () => {
  it("hydrates exercise metadata while preserving logged sets", () => {
    const sets = [
      { reps: "8", weight: "80" },
      { reps: "6", weight: "85" },
    ];

    expect(hydrateExercises([{ id: "bench-press", sets }])).toEqual([{
      ...exercisesData.find((exercise) => exercise.id === "bench-press"),
      id: "bench-press",
      sets,
    }]);
  });

  it("preserves ids and sets for exercises missing from the master list", () => {
    const sets = [{ reps: "12", weight: "20" }];

    expect(hydrateExercises([{ id: "custom-exercise", sets }])).toEqual([{
      id: "custom-exercise",
      sets,
    }]);
  });

  it("returns an empty list for non-array input", () => {
    expect(hydrateExercises(null)).toEqual([]);
    expect(hydrateExercises(undefined)).toEqual([]);
    expect(hydrateExercises({ id: "bench-press" })).toEqual([]);
  });

  it("does not mutate the supplied exercise data", () => {
    const exercises = [{
      id: "bench-press",
      sets: [{ reps: "8", weight: "80" }],
    }];
    const originalExercises = structuredClone(exercises);

    hydrateExercises(exercises);

    expect(exercises).toEqual(originalExercises);
  });
});
