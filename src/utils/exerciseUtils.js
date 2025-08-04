import exercisesData from '../data/exercises.json';

const exerciseById = exercisesData.reduce((acc, ex) => {
  acc[ex.id] = ex;
  return acc;
}, {});

export const hydrateExercises = (exercises) => {
    return exercises.map(exercise => {
        return {
            id: exercise.id,
            sets: exercise.sets,
            ...exerciseById[exercise.id]
        }
    })
}