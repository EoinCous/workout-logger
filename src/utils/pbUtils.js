export function getCurrentPBs(workouts) {
  const pbs = {};

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps, 10);
        const existing = pbs[exercise.id];

        const isNewPB =
          !existing ||
          weight > existing.weight ||
          (weight === existing.weight && reps > existing.reps);

        if (isNewPB) {
          pbs[exercise.id] = {
            exerciseId: exercise.id,
            name: exercise.name,
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