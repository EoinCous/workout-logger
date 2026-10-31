import { describe, expect, it } from "vitest";
import { getCurrentPBs } from "./pbUtils";

describe("getCurrentPBs", () => {
  it("returns no personal bests when there are no workouts", () => {
    expect(getCurrentPBs([])).toEqual({});
  });

  it("returns the best weight and uses reps to break equal-weight ties", () => {
    const workouts = [
      {
        date: "2026-10-28",
        exercises: [{
          id: "bench-press",
          sets: [
            { weight: "80", reps: "8" },
            { weight: "85", reps: "5" },
            { weight: "85", reps: "7" },
            { weight: "82", reps: "12" },
          ],
        }],
      },
      {
        date: "2026-10-30",
        exercises: [{
          id: "bench-press",
          sets: [{ weight: "85", reps: "6" }],
        }],
      },
    ];

    expect(getCurrentPBs(workouts)["bench-press"]).toEqual({
      exerciseId: "bench-press",
      name: "Barbell Bench Press",
      muscle: "chest",
      weight: 85,
      reps: 7,
      date: "2026-10-28",
    });
  });

  it("tracks personal bests independently for each exercise", () => {
    const workouts = [{
      date: "2026-10-31",
      exercises: [
        { id: "bench-press", sets: [{ weight: "80", reps: "8" }] },
        { id: "lat-pulldown", sets: [{ weight: "55.5", reps: "10" }] },
      ],
    }];

    expect(getCurrentPBs(workouts)).toEqual({
      "bench-press": {
        exerciseId: "bench-press",
        name: "Barbell Bench Press",
        muscle: "chest",
        weight: 80,
        reps: 8,
        date: "2026-10-31",
      },
      "lat-pulldown": {
        exerciseId: "lat-pulldown",
        name: "Lat Pulldown",
        muscle: "lats",
        weight: 55.5,
        reps: 10,
        date: "2026-10-31",
      },
    });
  });

  it("uses the exercise id when it is missing from the master list", () => {
    const result = getCurrentPBs([{
      date: "2026-10-31",
      exercises: [{
        id: "custom-exercise",
        sets: [{ weight: "40", reps: "12" }],
      }],
    }]);

    expect(result["custom-exercise"]).toEqual({
      exerciseId: "custom-exercise",
      name: "custom-exercise",
      muscle: undefined,
      weight: 40,
      reps: 12,
      date: "2026-10-31",
    });
  });

  it("ignores sets whose weight or reps cannot be parsed", () => {
    const result = getCurrentPBs([{
      date: "2026-10-31",
      exercises: [{
        id: "bench-press",
        sets: [
          { weight: "not a weight", reps: "8" },
          { weight: "80", reps: "not reps" },
          { weight: "", reps: "8" },
          { weight: "80", reps: "" },
        ],
      }],
    }]);

    expect(result).toEqual({});
  });

  it("does not mutate the supplied workouts", () => {
    const workouts = [{
      date: "2026-10-31",
      exercises: [{
        id: "bench-press",
        sets: [{ weight: "80", reps: "8" }],
      }],
    }];
    const originalWorkouts = structuredClone(workouts);

    getCurrentPBs(workouts);

    expect(workouts).toEqual(originalWorkouts);
  });
});
