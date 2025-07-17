import { useWorkout } from "../context/WorkoutContext";
import { useMemo } from "react";

const PersonalBests = () => {
  const { workouts } = useWorkout();

  const personalBests = useMemo(() => {
    const pbs = {};

    workouts.forEach(workout => {
      workout.exercises.forEach(ex => {
        ex.sets.forEach(set => {
          const weight = parseFloat(set.weight);
          const reps = parseInt(set.reps, 10);
          const existing = pbs[ex.id];

          const isNewPB =
            !existing ||
            weight > existing.weight ||
            (weight === existing.weight && reps > existing.reps);

          if (isNewPB) {
            pbs[ex.id] = {
              exerciseId: ex.id,
              name: ex.name,
              weight,
              reps,
              date: workout.date,
            };
          }
        });
      });
    });

    return pbs;
  }, [workouts]); // Only recalculate if workouts change

  return (
    <div>
      <h2>🏆 Personal Bests</h2>
      {Object.values(personalBests).map(pb => (
        <div key={pb.exerciseId}>
          <h3>{pb.name}</h3>
          <p>{pb.weight}kg × {pb.reps} reps</p>
          <small>on {new Date(pb.date).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
};

export default PersonalBests;