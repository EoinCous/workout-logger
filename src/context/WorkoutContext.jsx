import { createContext, useContext, useState, useEffect } from "react";
import { WORKOUT_STATUS } from "../constants/workoutStatus";

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState(() => {
    const savedPlan = localStorage.getItem("currentPlan");
    return savedPlan ? JSON.parse(savedPlan) : null;
  });
  const [status, setStatus] = useState(() => {
    return localStorage.getItem("workoutStatus") || WORKOUT_STATUS.IDLE;
  });

  const [lastWorkout, setLastWorkout] = useState(() => {
    const saved = localStorage.getItem("lastWorkout");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentLog, setCurrentLog] = useState(() => {
    const saved = localStorage.getItem("currentLog");
    return saved ? JSON.parse(saved) : null;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("workoutStatus", status);
    localStorage.setItem("currentPlan", JSON.stringify(currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(currentLog));
    localStorage.setItem("lastWorkout", JSON.stringify(lastWorkout));
  }, [status, currentPlan, currentLog, lastWorkout]);

  return (
    <WorkoutContext.Provider value={{
      status,
      setStatus,
      lastWorkout,
      setLastWorkout,
      currentPlan,
      setCurrentPlan,
      currentLog,
      setCurrentLog
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);