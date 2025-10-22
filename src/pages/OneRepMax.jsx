import { useState, useMemo } from "react";
import { useWorkout } from "../context/WorkoutContext";
import { getCurrentPBs } from "../utils/pbUtils";
import "../css/OneRepMax.css";

const calculate1RM = (weight, reps) => {
  if (!weight || !reps) return null;
  return Math.round(weight * (1 + reps / 30)); // Epley formula
};

const OneRepMax = () => {
  const { workouts } = useWorkout();
  const personalBests = useMemo(() => getCurrentPBs(workouts), [workouts]);
  const sortedPersonalBests = Object.values(personalBests).sort((a, b) => a.name.localeCompare(b.name));

  const [selectedExercise, setSelectedExercise] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedExercise(id);
    if (id) {
      const pb = personalBests[id];
      setWeight(pb?.weight || "");
      setReps(pb?.reps || "");
    }
  };

  const oneRM = calculate1RM(Number(weight), Number(reps));

  return (
    <div className="orm-container">
      <h2 className="page-title">💪 One Rep Max Calculator</h2>

      <div className="orm-form">
        <label>Choose exercise (from PBs):</label>
        <select value={selectedExercise} onChange={handleSelectChange}>
          <option value="">-- Select an exercise --</option>
          {sortedPersonalBests.map(pb => (
            <option key={pb.exerciseId} value={pb.exerciseId}>
              {pb.name}
            </option>
          ))}
        </select>

        <label>Weight (kg):</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter weight"
        />

        <label>Reps:</label>
        <input
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="Enter reps"
        />

        {oneRM && (
          <div className="orm-result">
            Estimated 1RM: <strong>{oneRM} kg</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneRepMax;