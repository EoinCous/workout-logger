const PUSH_MUSCLES = ["chest", "shoulders", "triceps"];
const PULL_MUSCLES = ["back", "biceps", "forearms", "traps", "rear_delts", "lats"];

export const MUSCLE_CATEGORIES = {
  Push: PUSH_MUSCLES,
  Pull: PULL_MUSCLES,
  Legs: ["quads", "hamstrings", "glutes", "calves", "adductors"],
  Upper: [...PUSH_MUSCLES, ...PULL_MUSCLES],
  Core: ["core", "obliques"]
};

export const ALL_MUSCLE_CATEGORY = "all";
export const MUSCLE_CATEGORY_OPTIONS = [ALL_MUSCLE_CATEGORY, ...Object.keys(MUSCLE_CATEGORIES)];
export const ALL_MUSCLES = [...new Set(Object.values(MUSCLE_CATEGORIES).flat())];

export const getWorkoutMuscleCategory = (workoutType) => {
  if (typeof workoutType !== "string") return ALL_MUSCLE_CATEGORY;

  const normalizedType = workoutType.toLowerCase();
  if (normalizedType === "full") return ALL_MUSCLE_CATEGORY;
  if (normalizedType === "lower") return "Legs";

  return Object.keys(MUSCLE_CATEGORIES).find(
    (category) => category.toLowerCase() === normalizedType
  ) ?? ALL_MUSCLE_CATEGORY;
};

export const getMuscleCategory = (muscleName) => {
  for (const [category, muscles] of Object.entries(MUSCLE_CATEGORIES)) {
    if (muscles.includes(muscleName)) return category;
  }
  return "Other";
};