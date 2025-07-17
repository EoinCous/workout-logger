import '../css/Workout.css';
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import { WORKOUT_STATUS } from "../constants/workoutStatus";

const Workout = () => {
  const {
    status,
    getLastWorkout,
    setStatus,
  } = useWorkout();

  const lastWorkout = getLastWorkout();

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
            <div className="last-workout-summary">
            <h3>Type: {lastWorkout.type}</h3>

            {lastWorkout.exercises.map((ex) => (
              <div key={ex.id} className="exercise-summary">
                <h4>{ex.name}</h4>
                <ul>
                  {ex.sets.map((set, index) => (
                    <li key={index}>
                      {set.reps} reps @ {set.weight}kg
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="workout-date">
              Completed on: {new Date(lastWorkout.completedAt).toLocaleDateString()} @{" "}
              {new Date(lastWorkout.completedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            
            <button className="plan-next-btn" onClick={handlePlanNextWorkout}>
              Plan Next Workout
            </button>
          </div>
          </> 
        ) : (
          <button onClick={handleStartPlanning}>Plan Your First Workout</button>
        )}
      </div>
    );
  }

  return null;
};

export default Workout;