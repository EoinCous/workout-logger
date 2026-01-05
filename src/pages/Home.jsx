import '../css/Home.css';
import { useNavigate } from 'react-router-dom';
import { useWorkout } from "../context/WorkoutContext";
import { isThisWeek, parseISO, isToday, format } from 'date-fns';
import { useMemo } from 'react';

const Home = () => {
  const { status, workouts, getLatestWorkout, weeklyGoal } = useWorkout();
  const navigate = useNavigate();

  const lastWorkout = getLatestWorkout();

  // 2. Weekly Stats Logic
  const weeklyWorkouts = useMemo(() => 
    workouts.filter(workout => 
      isThisWeek(parseISO(workout.date), { weekStartsOn: 1 })
    ), [workouts]
  );
  
  const weeklyProgressPercent = Math.min((weeklyWorkouts.length / (weeklyGoal || 1)) * 100, 100);

  // 3. Last Workout Duration Logic
  const getDuration = () => {
    if (!lastWorkout?.completedAt || !lastWorkout?.date) return 0;
    const ms = new Date(lastWorkout.completedAt) - new Date(lastWorkout.date);
    return Math.round(ms / 1000 / 60);
  };

  // 4. Render the "Hero" Card content based on status
  const renderHeroContent = () => {
    if (status === "inProgress") {
      return (
        <div className="hero-content active">
          <span className="status-badge pulse">🔴 Live Session</span>
          <h2>Resume Workout</h2>
          <p>You are currently training. Get back in there!</p>
        </div>
      );
    }
    
    // Check if workout is already done today
    if (status === "complete" && lastWorkout && isToday(parseISO(lastWorkout.date))) {
      return (
        <div className="hero-content done">
          <span className="status-badge success">✅ Completed</span>
          <h2>Great Job!</h2>
          <p>Rest up, you've crushed today's session.</p>
        </div>
      );
    }

    // Default: Planning
    return (
      <div className="hero-content plan">
        <span className="status-badge blue">📋 Ready?</span>
        <h2>Start Training</h2>
        <p>{status === "planning" ? "Continue planning your session." : "Plan today's workout."}</p>
      </div>
    );
  };

  return (
    <div className="home fade-in">
      <header className="home-header">
        <h1 className='page-title'>RepLog</h1>
      </header>

      {/* HERO CARD */}
      <div 
        className={`home-section hero-card ${status === 'inProgress' ? 'glow' : ''}`} 
        onClick={() => navigate('/workout')}
      >
        {renderHeroContent()}
      </div>

      {/* STATS ROW */}
      <div className="dashboard-grid">
        <div className="home-section widget" onClick={() => navigate('/weekly-progress')}>
          <h3>📉 Weekly Progress</h3>
          <div className="progress-wrapper">
            <div className="progress-labels">
              <span>{weeklyWorkouts.length} / {weeklyGoal} Workouts</span>
              <span>{Math.round(weeklyProgressPercent)}%</span>
            </div>
            <div className="custom-progress-bg">
              <div 
                className="custom-progress-fill" 
                style={{ width: `${weeklyProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="home-section widget" onClick={() => navigate(`/workout-summary`, { state: { workout: lastWorkout } })}>
          <h3>📅 Last Session</h3>
          {lastWorkout ? (
            <div className="mini-stat-box">
              <span className="highlight-text">{lastWorkout.type}</span>
              <span className="sub-text">
                {format(parseISO(lastWorkout.date), 'MMM d')} • {getDuration()} minutes
              </span>
            </div>
          ) : (
            <p className="empty-text">No history yet.</p>
          )}
        </div>
      </div>

      {/* TOOLS GRID */}
      <h3 className="section-label">Tools</h3>
      <div className="tools-grid">
        <div className="home-section tool-card" onClick={() => navigate('/personal-bests')}>
          <span className="tool-icon">🏆</span>
          <span className="tool-name">Records</span>
        </div>

        <div className="home-section tool-card" onClick={() => navigate('/one-rep-max')}>
          <span className="tool-icon">💪</span>
          <span className="tool-name">1 Rep Max</span>
        </div>

        <div className="home-section tool-card" onClick={() => navigate('/exercises')}>
          <span className="tool-icon">📚</span>
          <span className="tool-name">Library</span>
        </div>

        <div className="home-section tool-card" onClick={() => navigate('/suggestions')}>
          <span className="tool-icon">💡</span>
          <span className="tool-name">Suggest</span>
        </div>
      </div>
    </div>
  );
};

export default Home;