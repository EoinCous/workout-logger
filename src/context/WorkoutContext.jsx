import { createContext, useContext, useState, useEffect } from "react";
import { WORKOUT_STATUS } from "../constants/workoutStatus";

const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [status, setStatus] = useState(() => {
    return localStorage.getItem("workoutStatus") || WORKOUT_STATUS.IDLE;
  });

  const [currentPlan, setCurrentPlan] = useState(() => {
    const saved = localStorage.getItem("currentPlan");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentLog, setCurrentLog] = useState(() => {
    const saved = localStorage.getItem("currentLog");
    return saved ? JSON.parse(saved) : null;
  });

  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem("workouts");
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem("weeklyGoal");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem("workoutStatus", status);
    localStorage.setItem("currentPlan", JSON.stringify(currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(currentLog));
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("weeklyGoal", JSON.stringify(weeklyGoal));
  }, [status, currentPlan, currentLog, workouts, weeklyGoal]);

  const addWorkout = (workout) => {
    setWorkouts(prev => [...prev, workout]);
  };

  const removeWorkout = (dateToDelete) => {
    setWorkouts(prev => prev.filter(workout => workout.date !== dateToDelete));
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
      setWorkouts,
      addWorkout,
      removeWorkout,
      getLastWorkout,
      weeklyGoal,
      setWeeklyGoal
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);