import '../css/History.css';
import { useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useNavigate } from 'react-router-dom';
import { deleteWorkout } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';
import { format, parseISO } from 'date-fns';

const History = () => {
  const { workouts, setWorkouts } = useWorkout();
  const { user } = useAuthentication();
  const navigate = useNavigate();

  const groupedWorkouts = useMemo(() => {
    const groups = {};

    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach((workout) => {
      const date = parseISO(workout.date);
      const monthYear = format(date, 'MMMM yyyy');

      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(workout);
    });

    return groups;
  }, [workouts]);

  const getDuration = (workout) => {
    if (!workout.completedAt || !workout.date) return null;
    const start = new Date(workout.date);
    const end = new Date(workout.completedAt);
    const minutes = Math.round((end - start) / 1000 / 60);
    return `${minutes} min`;
  };

  const getVolume = (workout) => {
    let volume = 0;
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        volume += (set.weight || 0) * (set.reps || 0);
      });
    });
    return (volume / 1000).toFixed(1) + 'k kg'; // e.g., "5.2k kg"
  };

  const viewWorkout = (workout) => {
    navigate(`/workout-summary`, { state: { workout } });
  };

  const handleDeleteWorkout = async (e, workoutId) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this workout?")) return;

    const originalWorkouts = [...workouts];
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));

    try {
      await deleteWorkout(user?.id, workoutId);
    } catch (error) {
      console.error("Failed to delete:", error);
      setWorkouts(originalWorkouts);
      alert("Failed to delete workout.");
    }
  };

  return (
    <div className="history-page fade-in">
      <header className="history-header">
        <div className="history-heading">
          <p className="history-eyebrow">Training journal</p>
          <h1 className="history-title">Workout History</h1>
        </div>
        <div className="history-count" aria-label={`${workouts.length} completed sessions`}>
          <strong>{workouts.length}</strong>
          <span>{workouts.length === 1 ? "Session" : "Sessions"}</span>
        </div>
      </header>

      {Object.keys(groupedWorkouts).length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon" aria-hidden="true">🏋️</div>
          <h2>Your progress starts here</h2>
          <p>Completed workouts will show up here so you can look back on your training.</p>
          <button onClick={() => navigate('/workout')}>Start your first workout</button>
        </div>
      ) : (
        Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
          <div key={month} className="month-section">
            <div className="month-heading-row">
              <h2 className="month-header">{month}</h2>
              <span className="month-count">
                {monthWorkouts.length} {monthWorkouts.length === 1 ? "workout" : "workouts"}
              </span>
            </div>

            <div className="workout-list">
              {monthWorkouts.map((workout) => {
                const workoutDate = parseISO(workout.date);
                const duration = getDuration(workout);

                return (
                  <article key={workout.id} className="workout-card">
                    <button
                      type="button"
                      className="workout-card-main"
                      onClick={() => viewWorkout(workout)}
                      aria-label={`View ${workout.type} workout from ${format(workoutDate, 'MMMM d, yyyy')}`}
                    >
                      <span className="date-badge" aria-hidden="true">
                        <span className="day-name">{format(workoutDate, 'EEE')}</span>
                        <span className="day-num">{format(workoutDate, 'd')}</span>
                      </span>

                      <span className="workout-info">
                        <span className="workout-title">{workout.type}</span>
                        <span className="workout-meta">
                          <span className="workout-metric">
                            {workout.exercises.length} {workout.exercises.length === 1 ? "exercise" : "exercises"}
                          </span>
                          {duration && <span className="workout-metric">{duration}</span>}
                          <span className="workout-metric">{getVolume(workout)} volume</span>
                        </span>
                      </span>

                      <span className="workout-chevron" aria-hidden="true">›</span>
                    </button>
                    <button
                      type="button"
                      className="icon-btn delete-btn"
                      onClick={(event) => handleDeleteWorkout(event, workout.id)}
                      title="Delete workout"
                      aria-label={`Delete ${workout.type} workout from ${format(workoutDate, 'MMMM d, yyyy')}`}
                    >
                      🗑️
                    </button>
                  </article>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History;