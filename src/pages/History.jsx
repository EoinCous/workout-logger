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

  // 1. Group Workouts by Month (e.g., "January 2026")
  const groupedWorkouts = useMemo(() => {
    const groups = {};
    
    // Sort descending (newest first)
    const sorted = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(workout => {
      const date = parseISO(workout.date);
      const monthYear = format(date, 'MMMM yyyy');
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(workout);
    });

    return groups;
  }, [workouts]);

  // 2. Calculate Duration Helper
  const getDuration = (workout) => {
    if (!workout.completedAt || !workout.date) return null;
    const start = new Date(workout.date);
    const end = new Date(workout.completedAt);
    const minutes = Math.round((end - start) / 1000 / 60);
    return `${minutes} min`;
  };

  // 3. Calculate Total Volume Helper
  const getVolume = (workout) => {
    let volume = 0;
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        volume += (set.weight || 0) * (set.reps || 0);
      });
    });
    return (volume / 1000).toFixed(1) + 'k kg'; // e.g., "5.2k kg"
  };

  const viewWorkout = (workout) => {
    navigate(`/workout-summary`, { state: { workout } });
  };

  const handleDeleteWorkout = async (e, workoutId) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    if (!window.confirm("Are you sure you want to delete this workout?")) return;

    // OPTIMISTIC UPDATE: Remove from UI immediately
    const originalWorkouts = [...workouts];
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));

    try {
      await deleteWorkout(user?.id, workoutId);
    } catch (error) {
      console.error("Failed to delete:", error);
      // Revert if API fails
      setWorkouts(originalWorkouts);
      alert("Failed to delete workout.");
    }
  };

  return (
    <div className="history-page fade-in">
      <header className="history-header">
        <h1 className='page-title'>📅 History</h1>
        <span className="history-stats">
          {workouts.length} Sessions Completed
        </span>
      </header>

      {Object.keys(groupedWorkouts).length === 0 ? (
        <div className="empty-state">
          <p>No workouts logged yet.</p>
          <button onClick={() => navigate('/workout')}>Start Your First Workout</button>
        </div>
      ) : (
        Object.keys(groupedWorkouts).map(month => (
          <div key={month} className="month-section">
            <h3 className="month-header">{month}</h3>
            
            <div className="workout-list">
              {groupedWorkouts[month].map((workout) => (
                <div 
                  key={workout.id} 
                  className="workout-card"
                  onClick={() => viewWorkout(workout)}
                >
                  {/* Left: Date Badge */}
                  <div className="date-badge">
                    <span className="day-name">{format(parseISO(workout.date), 'EEE')}</span>
                    <span className="day-num">{format(parseISO(workout.date), 'd')}</span>
                  </div>

                  {/* Middle: Info */}
                  <div className="workout-info">
                    <h4 className="workout-title">{workout.type}</h4>
                    <div className="workout-meta">
                      <span>{workout.exercises.length} Exercises</span>
                      {getDuration(workout) && <span>• {getDuration(workout)}</span>}
                      <span>• {getVolume(workout)} Vol</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="card-actions">
                    <button 
                      className="icon-btn delete-btn"
                      onClick={(e) => handleDeleteWorkout(e, workout.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                    <span className="chevron">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default History;