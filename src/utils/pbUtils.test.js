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

  it("uses the longest valid duration as the personal best for timed exercises", () => {
    const result = getCurrentPBs([
      {
        date: "2026-10-28",
        exercises: [{
          id: "plank",
          sets: [
            { weight: "0", seconds: 45 },
            { weight: "0", seconds: 90 },
          ],
        }],
      },
      {
        date: "2026-10-30",
        exercises: [{
          id: "plank",
          sets: [{ weight: "0", seconds: 60 }],
        }],
      },
    ]);

    expect(result.plank).toEqual({
      exerciseId: "plank",
      name: "Plank",
      muscle: "core",
      trackingType: "time",
      seconds: 90,
      date: "2026-10-28",
    });
  });

  it("uses weight to break ties between equally long timed sets", () => {
    const result = getCurrentPBs([
      {
        date: "2026-10-28",
        exercises: [{
          id: "farmer-carries",
          sets: [{ weight: "15", seconds: 30 }],
        }],
      },
      {
        date: "2026-10-30",
        exercises: [{
          id: "farmer-carries",
          sets: [
            { weight: "20", seconds: 30 },
            { weight: "18", seconds: 30 },
            { weight: "30", seconds: 25 },
          ],
        }],
      },
    ]);

    expect(result["farmer-carries"]).toEqual({
      exerciseId: "farmer-carries",
      name: "Farmer Carries",
      muscle: "forearms",
      trackingType: "time",
      seconds: 30,
      weight: 20,
      date: "2026-10-30",
    });
  });

  it("ignores invalid and zero-duration timed sets", () => {
    const result = getCurrentPBs([{
      date: "2026-10-31",
      exercises: [{
        id: "plank",
        sets: [
          { seconds: 0 },
          { seconds: -1 },
          { seconds: "not seconds" },
          { reps: "10", weight: "0" },
        ],
      }],
    }]);

    expect(result).toEqual({});
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
