import { useWorkout } from "../context/WorkoutContext";
import { useMemo, useState } from "react";
import { getCurrentPBs } from "../utils/pbUtils";
import "../css/PersonalBests.css";

const PersonalBests = () => {
  const { workouts } = useWorkout();
  const personalBests = useMemo(() => getCurrentPBs(workouts), [workouts]);

  // Group PBs by muscle
  const groupedPBs = useMemo(() => {
    return Object.values(personalBests).reduce((groups, pb) => {
      const muscleGroup = pb.muscle || "Other";
      if (!groups[muscleGroup]) {
        groups[muscleGroup] = [];
      }
      groups[muscleGroup].push(pb);
      return groups;
    }, {});
  }, [personalBests]);

  // Track which muscle groups are open
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (muscle) => {
    setOpenGroups((prev) => ({
      ...prev,
      [muscle]: !prev[muscle],
    }));
  };

  return (
    <div className="pb-container">
      <h2 className="page-title">🏆 Personal Bests</h2>

      {Object.entries(groupedPBs).map(([muscle, pbs]) => (
        <div key={muscle} className="pb-muscle-group">
          <h3 
            className="pb-muscle-title" 
            onClick={() => toggleGroup(muscle)}
            style={{ cursor: "pointer" }}
          >
            {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
            {openGroups[muscle] ? " ▼" : " ►"}
          </h3>

          {openGroups[muscle] && (
            <div className="pb-group-list">
              {pbs.map((pb) => (
                <div key={pb.exerciseId} className="pb-card">
                  <h4 className="pb-exercise">{pb.name}</h4>
                  <p className="pb-value">{pb.weight}kg × {pb.reps} reps</p>
                  <small className="pb-date">
                    on {new Date(pb.date).toLocaleDateString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PersonalBests;