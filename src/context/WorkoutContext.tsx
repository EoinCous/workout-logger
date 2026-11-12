import { createContext, useContext, useState, useEffect } from "react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { WORKOUT_STATUS } from "../constants/workoutStatus";
import type { PersonalBestRecord } from "../utils/pbUtils";

type WorkoutSet = {
  reps?: string | number;
  weight?: string | number;
  seconds?: number;
};

type WorkoutExercise = {
  id: string;
  sets?: WorkoutSet[];
};

type WorkoutPlan = {
  date: string;
  type: string;
  exercises: WorkoutExercise[];
  startedAt?: string;
};

type WorkoutLog = {
  startedAt?: string;
  exercises: WorkoutExercise[];
  notes: string;
};

type WorkoutRecord = {
  id?: string;
  date: string;
  type: string;
  exercises: WorkoutExercise[];
  notes?: string | null;
};

type WorkoutTemplate = {
  id: string;
  name?: string;
  type?: string;
  exercises: WorkoutExercise[];
};

type WorkoutContextValue = {
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  currentPlan: WorkoutPlan | null;
  setCurrentPlan: Dispatch<SetStateAction<WorkoutPlan | null>>;
  currentLog: WorkoutLog | null;
  setCurrentLog: Dispatch<SetStateAction<WorkoutLog | null>>;
  workouts: WorkoutRecord[];
  setWorkouts: Dispatch<SetStateAction<WorkoutRecord[]>>;
  personalBests: PersonalBestRecord;
  setPersonalBests: Dispatch<SetStateAction<PersonalBestRecord>>;
  getLatestWorkout: () => WorkoutRecord | null;
  getLatestWorkouts: () => WorkoutRecord[];
  weeklyGoal: number | null;
  setWeeklyGoal: Dispatch<SetStateAction<number | null>>;
  templates: WorkoutTemplate[];
  setTemplates: Dispatch<SetStateAction<WorkoutTemplate[]>>;
  resetWorkoutData: () => void;
};

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export const WorkoutProvider = ({ children }: PropsWithChildren) => {
  const [status, setStatus] = useState<string>(() => {
    return localStorage.getItem("workoutStatus") || WORKOUT_STATUS.IDLE;
  });

  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(() => {
    const saved = localStorage.getItem("currentPlan");
    return saved ? (JSON.parse(saved) as WorkoutPlan) : null;
  });

  const [currentLog, setCurrentLog] = useState<WorkoutLog | null>(() => {
    const saved = localStorage.getItem("currentLog");
    return saved ? (JSON.parse(saved) as WorkoutLog) : null;
  });

  const [workouts, setWorkouts] = useState<WorkoutRecord[]>(() => {
    const saved = localStorage.getItem("workouts");
    return saved ? (JSON.parse(saved) as WorkoutRecord[]) : [];
  });

  const [personalBests, setPersonalBests] = useState<PersonalBestRecord>(() => {
    const saved = localStorage.getItem("personalBests");
    return saved ? (JSON.parse(saved) as PersonalBestRecord) : {};
  });

  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(() => {
    const saved = localStorage.getItem("weeklyGoal");
    return saved ? (JSON.parse(saved) as number) : null;
  });

  const [templates, setTemplates] = useState<WorkoutTemplate[]>(() => {
    const saved = localStorage.getItem("templates");
    return saved ? (JSON.parse(saved) as WorkoutTemplate[]) : [];
  });

  useEffect(() => {
    localStorage.setItem("workoutStatus", status);
    localStorage.setItem("currentPlan", JSON.stringify(currentPlan));
    localStorage.setItem("currentLog", JSON.stringify(currentLog));
    localStorage.setItem("workouts", JSON.stringify(workouts));
    localStorage.setItem("personalBests", JSON.stringify(personalBests));
    localStorage.setItem("weeklyGoal", JSON.stringify(weeklyGoal));
    localStorage.setItem("templates", JSON.stringify(templates));
  }, [status, currentPlan, currentLog, workouts, personalBests, weeklyGoal, templates]);

  const getLatestWorkout = (): WorkoutRecord | null => {
    return workouts.length > 0 ? workouts[0] : null;
  };

  const getLatestWorkouts = (): WorkoutRecord[] => {
    return workouts.slice(0, 3);
  };

  const resetWorkoutData = () => {
    setStatus("idle");
    setCurrentPlan(null);
    setCurrentLog(null);
    setWeeklyGoal(null);
    setWorkouts([]);
    setPersonalBests({});
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
      personalBests,
      setPersonalBests,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkout = (): WorkoutContextValue => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};