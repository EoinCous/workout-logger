import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabaseClient";
import {
  clearCurrentPlan,
  deleteTemplate,
  deleteWorkout,
  fetchCurrentPlan,
  fetchTemplates,
  fetchWeeklyGoal,
  fetchWorkouts,
  insertTemplate,
  insertWorkout,
  upsertCurrentPlan,
  upsertWeeklyGoal,
} from "./supabaseWorkoutService";

let queryResults;
let queryCalls;

const createQueryBuilder = (table, result) => {
  const builder = {};
  const record = (method) => (...args) => {
    queryCalls.push({ table, method, args });
    return builder;
  };

  for (const method of ["select", "insert", "delete", "upsert", "eq", "order"]) {
    builder[method] = record(method);
  }
  builder.maybeSingle = record("maybeSingle");
  builder.single = record("single");
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);

  return builder;
};

const calledWith = (method, table) =>
  queryCalls.find((call) => call.method === method && call.table === table);

describe("supabaseWorkoutService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResults = [];
    queryCalls = [];
    supabase.from.mockImplementation((table) => {
      queryCalls.push({ table, method: "from", args: [] });
      return createQueryBuilder(table, queryResults.shift());
    });
  });

  it("fetches workouts in descending date order and maps database fields", async () => {
    const databaseWorkouts = [{
      id: "workout-1",
      date: "2026-10-31",
      type: "strength",
      exercises: [{ id: "bench-press", sets: [{ reps: "8", weight: "80" }] }],
      personal_bests: { "bench-press": { weight: 80, reps: 8 } },
      completed_at: "2026-10-31T10:00:00.000Z",
      notes: "Good session",
    }];
    queryResults.push({ data: databaseWorkouts, error: null });

    await expect(fetchWorkouts("user-1")).resolves.toEqual([{
      id: "workout-1",
      date: "2026-10-31",
      type: "strength",
      exercises: databaseWorkouts[0].exercises,
      personalBests: databaseWorkouts[0].personal_bests,
      completedAt: "2026-10-31T10:00:00.000Z",
      notes: "Good session",
    }]);

    expect(supabase.from).toHaveBeenCalledWith("workouts");
    expect(calledWith("select", "workouts").args[0])
      .toBe("id, date, type, exercises, personal_bests, completed_at, notes");
    expect(calledWith("eq", "workouts").args).toEqual(["user_id", "user-1"]);
    expect(calledWith("order", "workouts").args).toEqual(["date", { ascending: false }]);
  });

  it("propagates workout fetch errors", async () => {
    const error = new Error("Fetch failed");
    queryResults.push({ data: null, error });

    await expect(fetchWorkouts("user-1")).rejects.toBe(error);
  });

  it("inserts a workout with only exercise ids and sets", async () => {
    const inserted = { id: "workout-1" };
    queryResults.push({ data: inserted, error: null });
    const workout = {
      date: "2026-10-31",
      type: "strength",
      exercises: [{
        id: "bench-press",
        name: "Barbell Bench Press",
        sets: [{ reps: "8", weight: "80" }],
      }],
      personalBests: { "bench-press": { weight: 80, reps: 8 } },
      completedAt: "2026-10-31T10:00:00.000Z",
      notes: "Good session",
    };

    await expect(insertWorkout("user-1", workout)).resolves.toBe(inserted);
    expect(calledWith("insert", "workouts").args[0]).toEqual({
      user_id: "user-1",
      date: workout.date,
      type: workout.type,
      exercises: [{ id: "bench-press", sets: workout.exercises[0].sets }],
      personal_bests: workout.personalBests,
      completed_at: workout.completedAt,
      notes: workout.notes,
    });
    expect(queryCalls.filter((call) => call.table === "workouts").map((call) => call.method))
      .toEqual(["from", "insert", "select", "single"]);
  });

  it("propagates workout insert errors", async () => {
    const error = new Error("Insert failed");
    queryResults.push({ data: null, error });

    await expect(insertWorkout("user-1", {
      exercises: [],
    })).rejects.toBe(error);
  });

  it("deletes a workout for the matching user and workout id", async () => {
    queryResults.push({ error: null });

    await expect(deleteWorkout("user-1", "workout-1")).resolves.toBeUndefined();
    expect(queryCalls.filter((call) => call.table === "workouts").map((call) => call.method))
      .toEqual(["from", "delete", "eq", "eq"]);
    expect(queryCalls.filter((call) => call.method === "eq").map((call) => call.args))
      .toEqual([["user_id", "user-1"], ["id", "workout-1"]]);
  });

  it("propagates workout delete errors", async () => {
    const error = new Error("Delete failed");
    queryResults.push({ error });

    await expect(deleteWorkout("user-1", "workout-1")).rejects.toBe(error);
  });

  it("fetches the user's current plan and returns null when none exists", async () => {
    queryResults.push({ data: null, error: null });

    await expect(fetchCurrentPlan("user-1")).resolves.toBeNull();
    expect(supabase.from).toHaveBeenCalledWith("current_plan");
    expect(calledWith("select", "current_plan").args[0]).toBe("date, exercises, type");
    expect(calledWith("eq", "current_plan").args).toEqual(["user_id", "user-1"]);
    expect(queryCalls.some((call) => call.method === "maybeSingle")).toBe(true);
  });

  it("propagates current plan fetch errors", async () => {
    const error = new Error("Plan fetch failed");
    queryResults.push({ data: null, error });

    await expect(fetchCurrentPlan("user-1")).rejects.toBe(error);
  });

  it("upserts a current plan with cleaned exercises and the user conflict key", async () => {
    const savedPlan = { date: "2026-10-31", type: "full" };
    queryResults.push({ data: savedPlan, error: null });
    const plan = {
      date: "2026-10-31",
      type: "full",
      exercises: [{ id: "bench-press", name: "Bench Press", sets: [{ reps: "8", weight: "80" }] }],
    };

    await expect(upsertCurrentPlan("user-1", plan)).resolves.toBe(savedPlan);
    expect(calledWith("upsert", "current_plan").args).toEqual([{
      user_id: "user-1",
      date: plan.date,
      exercises: [{ id: "bench-press", sets: plan.exercises[0].sets }],
      type: "full",
    }, { onConflict: ["user_id"] }]);
  });

  it("propagates current plan upsert errors", async () => {
    const error = new Error("Plan upsert failed");
    queryResults.push({ data: null, error });

    await expect(upsertCurrentPlan("user-1", { exercises: [] })).rejects.toBe(error);
  });

  it("clears the current plan for a user", async () => {
    queryResults.push({ error: null });

    await expect(clearCurrentPlan("user-1")).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("current_plan");
    expect(calledWith("eq", "current_plan").args).toEqual(["user_id", "user-1"]);
  });

  it("propagates current plan clear errors", async () => {
    const error = new Error("Plan clear failed");
    queryResults.push({ error });

    await expect(clearCurrentPlan("user-1")).rejects.toBe(error);
  });

  it("returns the user's weekly goal", async () => {
    queryResults.push({ data: { weekly_goal: 4 }, error: null });

    await expect(fetchWeeklyGoal("user-1")).resolves.toBe(4);
    expect(supabase.from).toHaveBeenCalledWith("weekly_goal");
    expect(calledWith("select", "weekly_goal").args[0]).toBe("weekly_goal");
    expect(calledWith("eq", "weekly_goal").args).toEqual(["user_id", "user-1"]);
  });

  it("returns undefined when no weekly goal exists and propagates fetch errors", async () => {
    queryResults.push({ data: null, error: null });
    await expect(fetchWeeklyGoal("user-1")).resolves.toBeUndefined();

    const error = new Error("Goal fetch failed");
    queryResults.push({ data: null, error });
    await expect(fetchWeeklyGoal("user-1")).rejects.toBe(error);
  });

  it("upserts a user's weekly goal", async () => {
    const savedGoal = { weekly_goal: 4 };
    queryResults.push({ data: savedGoal, error: null });

    await expect(upsertWeeklyGoal("user-1", 4)).resolves.toBe(savedGoal);
    expect(calledWith("upsert", "weekly_goal").args).toEqual([
      { user_id: "user-1", weekly_goal: 4 },
      { onConflict: ["user_id"] },
    ]);
  });

  it("propagates weekly goal upsert errors", async () => {
    const error = new Error("Goal upsert failed");
    queryResults.push({ data: null, error });

    await expect(upsertWeeklyGoal("user-1", 4)).rejects.toBe(error);
  });

  it("fetches templates in descending creation order", async () => {
    const templates = [{ id: "template-1", name: "Full Body" }];
    queryResults.push({ data: templates, error: null });

    await expect(fetchTemplates("user-1")).resolves.toBe(templates);
    expect(supabase.from).toHaveBeenCalledWith("templates");
    expect(calledWith("select", "templates").args[0])
      .toBe("id, name, exercises, type, created_at");
    expect(calledWith("eq", "templates").args).toEqual(["user_id", "user-1"]);
    expect(calledWith("order", "templates").args).toEqual(["created_at", { ascending: false }]);
  });

  it("propagates template fetch errors", async () => {
    const error = new Error("Template fetch failed");
    queryResults.push({ data: null, error });

    await expect(fetchTemplates("user-1")).rejects.toBe(error);
  });

  it("inserts a template when the user is below the limit", async () => {
    const insertedTemplate = { id: "template-1", name: "Full Body" };
    queryResults.push(
      { count: 4, error: null },
      { data: insertedTemplate, error: null }
    );
    const template = {
      name: "Full Body",
      type: "full",
      exercises: [{ id: "bench-press", name: "Bench Press", sets: [{ reps: "8", weight: "80" }] }],
    };

    await expect(insertTemplate("user-1", template)).resolves.toBe(insertedTemplate);
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(calledWith("select", "templates").args).toEqual(["*", { count: "exact", head: true }]);
    expect(calledWith("insert", "templates").args[0]).toEqual({
      user_id: "user-1",
      name: "Full Body",
      exercises: [{ id: "bench-press", sets: template.exercises[0].sets }],
      type: "full",
    });
  });

  it("rejects template creation at the five-template limit", async () => {
    queryResults.push({ count: 5, error: null });

    await expect(insertTemplate("user-1", {
      name: "Full Body",
      exercises: [],
    })).rejects.toMatchObject({
      message: "Template limit reached",
      code: "LIMIT_REACHED",
    });
    expect(supabase.from).toHaveBeenCalledOnce();
    expect(queryCalls.some((call) => call.method === "insert")).toBe(false);
  });

  it("propagates template count and insert errors", async () => {
    const countError = new Error("Count failed");
    queryResults.push({ count: null, error: countError });

    await expect(insertTemplate("user-1", { exercises: [] })).rejects.toBe(countError);
    expect(supabase.from).toHaveBeenCalledOnce();

    const insertError = new Error("Template insert failed");
    queryResults.push(
      { count: 2, error: null },
      { data: null, error: insertError }
    );
    await expect(insertTemplate("user-1", { exercises: [] })).rejects.toBe(insertError);
  });

  it("deletes a template for the matching user and template id", async () => {
    queryResults.push({ error: null });

    await expect(deleteTemplate("user-1", "template-1")).resolves.toBeUndefined();
    expect(supabase.from).toHaveBeenCalledWith("templates");
    expect(queryCalls.filter((call) => call.method === "eq").map((call) => call.args))
      .toEqual([["user_id", "user-1"], ["id", "template-1"]]);
  });

  it("propagates template delete errors", async () => {
    const error = new Error("Template delete failed");
    queryResults.push({ error });

    await expect(deleteTemplate("user-1", "template-1")).rejects.toBe(error);
  });
});
