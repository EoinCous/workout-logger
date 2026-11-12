import exercisesData from '../data/exercises.json';

type ExerciseDefinition = (typeof exercisesData)[number];
type WorkoutSet = {
  reps?: string | number;
  weight?: string | number;
  seconds?: string | number;
};
type WorkoutExercise = {
  id: string;
  sets?: WorkoutSet[];
};
type Workout = {
  date: string;
  exercises: WorkoutExercise[];
};
type PersonalBestBase = {
  exerciseId: string;
  name: string;
  muscle: string | undefined;
  date: string;
  achievedInWorkoutId?: string;
};
type RepPersonalBest = PersonalBestBase & {
  weight: number;
  reps: number;
  trackingType?: never;
  seconds?: never;
};
type TimedPersonalBest = PersonalBestBase & {
  trackingType: 'time';
  seconds: number;
  weight?: number;
  reps?: never;
};
export type PersonalBest = RepPersonalBest | TimedPersonalBest;
export type PersonalBestRecord = Record<string, PersonalBest>;

const exerciseById = exercisesData.reduce<Record<string, ExerciseDefinition>>((acc, exercise) => {
  acc[exercise.id] = exercise;
  return acc;
}, {});

export function getCurrentPBs(workouts: Workout[]): Record<string, PersonalBest> {
  const personalBests: Record<string, PersonalBest> = {};

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const master = exerciseById[exercise.id];
      const name = master?.name || exercise.id;
      const muscle = master?.muscle;

      exercise.sets?.forEach((set) => {
        if (master?.trackingType === 'time') {
          const seconds = Number(set.seconds);
          if (!Number.isInteger(seconds) || seconds <= 0) return;

          const parsedWeight = Number.parseFloat(String(set.weight));
          const weight = Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : undefined;
          const existing = personalBests[exercise.id];
          if (
            !existing ||
            seconds > (existing.seconds ?? 0) ||
            (seconds === existing.seconds && (weight || 0) > (existing.weight || 0))
          ) {
            personalBests[exercise.id] = {
              exerciseId: exercise.id,
              name,
              muscle,
              trackingType: 'time',
              seconds,
              ...(weight !== undefined && { weight }),
              date: workout.date,
            };
          }
          return;
        }

        const weight = Number.parseFloat(String(set.weight));
        const reps = Number.parseInt(String(set.reps), 10);
        if (Number.isNaN(weight) || Number.isNaN(reps)) return;

        const existing = personalBests[exercise.id];
        const isNewPB =
          !existing ||
          weight > (existing.weight ?? 0) ||
          (weight === existing.weight && reps > (existing.reps ?? 0));

        if (isNewPB) {
          personalBests[exercise.id] = {
            exerciseId: exercise.id,
            name,
            muscle,
            weight,
            reps,
            date: workout.date,
          };
        }
      });
    });
  });

  return personalBests;
}
