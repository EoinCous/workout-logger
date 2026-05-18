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

  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("templates");
    return saved ? JSON.parse(saved) : [];
  })

  useEffect(() => {
    localStorage.setItem("workoutStatus", status);
    localStorage.setItem("currentPlan", JSON.stringify(currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(currentLog));
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("weeklyGoal", JSON.stringify(weeklyGoal));
    localStorage.setItem("templates", JSON.stringify(templates));
  }, [status, currentPlan, currentLog, workouts, weeklyGoal, templates]);

  const getLatestWorkout = () => {
    return workouts.length > 0 ? workouts[0] : null;
  };

  const getLatestWorkouts = () => {
    return workouts.slice(0, 3);
  };

  const resetWorkoutData = () => {
    setStatus("idle");
    setCurrentPlan(null);
    setCurrentLog(null);
    setWeeklyGoal(null);
    setWorkouts([]);
    setTemplates([]);
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
      getLatestWorkout,
      getLatestWorkouts,
      weeklyGoal,
      setWeeklyGoal,
      templates,
      setTemplates,
      resetWorkoutData
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => useContext(WorkoutContext);