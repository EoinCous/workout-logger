export const MUSCLE_CATEGORIES = {
  Push: ["chest", "shoulders", "triceps"],
  Pull: ["back", "biceps", "forearms", "traps", "rear_delts", "lats"],
  Legs: ["quads", "hamstrings", "glutes", "calves", "adductors"],
  Core: ["core", "obliques"]
};

// Derived Categories to avoid manual repetition
export const ALL_MUSCLES = Object.values(MUSCLE_CATEGORIES).flat();

export const getMuscleCategory = (muscleName) => {
  for (const [category, muscles] of Object.entries(MUSCLE_CATEGORIES)) {
    if (muscles.includes(muscleName)) return category;
  }
  return "Other";
};