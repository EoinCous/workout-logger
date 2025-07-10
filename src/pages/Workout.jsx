import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import { WORKOUT_STATUS } from "../constants/workoutStatus";

const Workout = () => {
  const {
    status,
    lastWorkout,
    currentPlan,
    currentLog,
    setStatus,
  } = useWorkout();

  const navigate = useNavigate();

  useEffect(() => {
    if (status === WORKOUT_STATUS.PLANNING || status === WORKOUT_STATUS.PLANNED) {
      navigate("/workout-planner");
    } else if (status === WORKOUT_STATUS.IN_PROGRESS) {
      navigate("/workout-log");
    }
  }, [status, navigate]);

  const handleStartPlanning = () => {
    setStatus(WORKOUT_STATUS.PLANNING);
    navigate("/workout-planner");
  };

  const handlePlanNextWorkout = () => {
    setStatus(WORKOUT_STATUS.PLANNING);
    navigate("/workout-planner");
  };

  if (status === WORKOUT_STATUS.COMPLETE || status === WORKOUT_STATUS.IDLE) {
    return (
      <div>
        {lastWorkout ? (
          <>
            <h2>Last Workout Summary</h2>
            <pre>{JSON.stringify(lastWorkout, null, 2)}</pre>
            <button onClick={handlePlanNextWorkout}>Plan Next Workout</button>
          </>
        ) : (
          <button onClick={handleStartPlanning}>Plan Your First Workout</button>
        )}
      </div>
    );
  }

  return null; // Redirect will occur in useEffect
};

export default Workout;