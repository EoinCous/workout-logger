import exercisesData from '../data/exercises.json';

const exerciseById = exercisesData.reduce((acc, exercise) => {
  acc[exercise.id] = exercise;
  return acc;
}, {});

export const hydrateExercises = (exercises) => {
    if (!Array.isArray(exercises)) return [];
    
    return exercises.map(exercise => {
        return {
            id: exercise.id,
            sets: exercise.sets,
            ...exerciseById[exercise.id]
        }
    })
}