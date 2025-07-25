import { useWorkout } from "../context/WorkoutContext";
import { useMemo } from "react";
import { getCurrentPBs } from "../utils/pbUtils";
import "../css/PersonalBests.css";

const PersonalBests = () => {
  const { workouts } = useWorkout();

  const personalBests = useMemo(() => getCurrentPBs(workouts), [workouts]);

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