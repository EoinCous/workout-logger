import { createContext, useContext, useState, useEffect } from "react";
import { WORKOUT_STATUS } from "../constants/workoutStatus";

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [status, setStatus] = useState(() => {
    return localStorage.getItem("workoutStatus") || WORKOUT_STATUS.IDLE;
  });

  const [currentPlan, setCurrentPlan] = useState(() => {
    const savedPlan = localStorage.getItem("currentPlan");
    return savedPlan ? JSON.parse(savedPlan) : null;
  });

  const [currentLog, setCurrentLog] = useState(() => {
    const saved = localStorage.getItem("currentLog");
    return saved ? JSON.parse(saved) : null;
  });

  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem("workouts");
    return saved ? JSON.parse(saved) : [];
  });

  const [personalBests, setPersonalBests] = useState(() => {
    const saved = localStorage.getItem("personalBests");
    return saved ? JSON.parse(saved) : [];
  })

  useEffect(() => {
    localStorage.setItem("workoutStatus", status);
    localStorage.setItem("currentPlan", JSON.stringify(currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(currentLog));
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("personalBests", JSON.stringify(personalBests));
  }, [status, currentPlan, currentLog, workouts, personalBests]);

  const addWorkoutToHistory = (workout) => {
    setWorkouts(prev => [...prev, workout]);
  };

  const getLastWorkout = () => {
    return workouts.length > 0 ? workouts[workouts.length - 1] : null;
  };

  function updatePersonalBests(workout) {
    const newPBs = { ...personalBests };

    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        const weight = parseFloat(set.weight);
        const reps = parseInt(set.reps, 10);
        const existing = newPBs[exercise.id];

        const isNewPB =
          !existing ||
          weight > existing.weight ||
          (weight === existing.weight && reps > existing.reps);

        if (isNewPB) {
          newPBs[exercise.id] = {
            exerciseId: exercise.id,
            name: exercise.name,
            weight,
            reps,
            date: workout.date,
          };
        }
      });
    });

    setPersonalBests(newPBs);
  }

  return (
    <WorkoutContext.Provider value={{
      status,
      setStatus,
      currentPlan,
      setCurrentPlan,
      currentLog,
      setCurrentLog,
      workouts,
      addWorkoutToHistory,
      getLastWorkout,
      personalBests,
      updatePersonalBests
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);