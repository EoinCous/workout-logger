import { useWorkout } from "../context/WorkoutContext";
import { useMemo } from "react";
import "../css/PersonalBests.css";

const PersonalBests = () => {
  const { workouts } = useWorkout();

  const personalBests = useMemo(() => {
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
  }, [workouts]);

  return (
    <div className="pb-container">
      <h2 className="page-title">🏆 Personal Bests</h2>
      {Object.values(personalBests).map(pb => (
        <div key={pb.exerciseId} className="pb-card">
          <h3 className="pb-exercise">{pb.name}</h3>
          <p className="pb-value">{pb.weight}kg × {pb.reps} reps</p>
          <small className="pb-date">on {new Date(pb.date).toLocaleDateString()}</small>
        </div>
      ))}
    </div>
  );
};

export default PersonalBests;