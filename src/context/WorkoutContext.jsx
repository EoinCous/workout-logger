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

  useEffect(() => {
    localStorage.setItem("workoutStatus", status);
    localStorage.setItem("currentPlan", JSON.stringify(currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(currentLog));
    localStorage.setItem("workouts", JSON.stringify(workouts));
  }, [status, currentPlan, currentLog, workouts]);

  const addWorkoutToHistory = (workout) => {
    setWorkouts(prev => [...prev, workout]);
  };

  const getLastWorkout = () => {
    return workouts.length > 0 ? workouts[workouts.length - 1] : null;
  };

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
      getLastWorkout
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);