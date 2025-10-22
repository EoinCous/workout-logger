import '../css/Workout.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import { WORKOUT_STATUS } from "../constants/workoutStatus";
import { hydrateExercises } from '../utils/exerciseUtils';

const Workout = () => {
  const {
    status,
    getLatestWorkouts,
    setStatus,
  } = useWorkout();

  const latestWorkouts = getLatestWorkouts();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState({});

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

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id], // toggle individual workout
    }));
  };

  if (status === WORKOUT_STATUS.COMPLETE || status === WORKOUT_STATUS.IDLE) {
    return (
      <div>
        <h1 className='page-title'>🏋️ Workout</h1>
        {latestWorkouts && latestWorkouts.length > 0 ? (
          <>
          <div className='latest-workouts'>
            <h2>Latest Workouts</h2>

            {latestWorkouts.map((workout) => (
              <div key={workout.id} className="last-workout-summary">
                <div
                  className="workout-header"
                  onClick={() => toggleExpand(workout.id)}
                >
                  <h3>{workout.type} — {new Date(workout.date).toLocaleDateString()}</h3>
                  <h3>{expanded[workout.id] ? "▸" : "▾"}</h3>
                </div>

                {expanded[workout.id] && (
                  <div className="workout-details">
                    {hydrateExercises(workout.exercises).map((ex) => (
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
                  </div>
                )}
              </div>
            ))}
          </div>
            
            <button className="plan-btn" onClick={handlePlanNextWorkout}>
              Plan Next Workout
            </button>
          </>
        ) : (
          <div>
            <button className="plan-btn" onClick={handleStartPlanning}>
              Plan Your First Workout
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Workout;