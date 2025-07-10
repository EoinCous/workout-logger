import { createContext, useContext, useState, useEffect } from "react";
import { WORKOUT_STATUS } from "../constants/workoutStatus";

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [status, setStatus] = useState(WORKOUT_STATUS.IDLE);
  const [lastWorkout, setLastWorkout] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentLog, setCurrentLog] = useState(null);

  // Load from localStorage on first render
  useEffect(() => {
    const savedStatus = localStorage.getItem("workoutStatus");
    const savedPlan = JSON.parse(localStorage.getItem("currentPlan"));
    const savedLog = JSON.parse(localStorage.getItem("currentLog"));
    const savedLastWorkout = JSON.parse(localStorage.getItem("lastWorkout"));

    if (savedStatus) setStatus(savedStatus);
    if (savedPlan) setCurrentPlan(savedPlan);
    if (savedLog) setCurrentLog(savedLog);
    if (savedLastWorkout) setLastWorkout(savedLastWorkout);
  }, []);

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