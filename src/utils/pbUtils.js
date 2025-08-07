import exercisesData from '../data/exercises.json';

const exerciseById = exercisesData.reduce((acc, ex) => {
  acc[ex.id] = ex;
  return acc;
}, {});

export function getCurrentPBs(workouts) {
  const pbs = {};

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      
      // hydrate from master list
      const master = exerciseById[exercise.id];
      const name = master?.name || exercise.id; // fallback if missing

      exercise.sets.forEach(set => {
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps, 10);
        if (isNaN(weight) || isNaN(reps)) return;

        const existing = pbs[exercise.id];

        const isNewPB =
          !existing ||
          weight > existing.weight ||
          (weight === existing.weight && reps > existing.reps);

        if (isNewPB) {
          pbs[exercise.id] = {
            exerciseId: exercise.id,
            name,
            weight,
            reps,
            date: workout.date,
          };
        }
      });
    });
  });

  return pbs;
}