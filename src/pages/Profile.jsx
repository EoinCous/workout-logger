import { useState, useEffect, useMemo } from "react";
import { useAuthentication } from "../context/AuthenticationContext";
import { useWorkout } from "../context/WorkoutContext";
import '../css/Profile.css';

const Profile = () => {
  const { user, logout } = useAuthentication();
  const { workouts, weeklyGoal, resetWorkoutData } = useWorkout();

  // --- Theme Toggle Logic ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or default to dark mode
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    // Apply theme class to the body so it affects the whole app
    document.body.className = isDarkMode ? "dark-theme" : "light-theme";
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const insights = useMemo(() => {
    let totalVolume = 0;
    const exerciseCounts = {};

    workouts.forEach((workout) => {
      workout.exercises?.forEach((ex) => {
        ex.sets?.forEach((set) => {
          totalVolume += (Number(set.weight) || 0) * (Number(set.reps) || 0);
        });

        // Count Exercises to find the favorite
        exerciseCounts[ex.id] = (exerciseCounts[ex.id] || 0) + 1;
      });
    });

    let favoriteExerciseId = "";
    let maxCount = 0;
    for (const [id, count] of Object.entries(exerciseCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favoriteExerciseId = id;
      }
    }

    // Convert "leg-extension-machine" -> "Leg Extension Machine"
    const favoriteExercise = favoriteExerciseId
      ? favoriteExerciseId
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      : "Not enough data";

    return { totalVolume, favoriteExercise };
  }, [workouts]);

  const handleLogout = async () => {
    try {
      resetWorkoutData();
      await logout();
    } catch (error) {
      console.error("Error during logout process:", error);
    }
  };

  const totalWorkouts = workouts.length;
  const lastWorkout = totalWorkouts
    ? new Date(workouts[0].date).toLocaleDateString()
    : "No workouts yet";

  const joinDate = user?.confirmed_at 
    ? new Date(user.confirmed_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : "Unknown";

  return (
    <div className="profile-page fade-in">
      <h1 className="page-title">Profile</h1>

      {/* 1. USER IDENTITY */}
      <section className="profile-section">
        <div className="identity-card">
          <div className="avatar-placeholder">
            {user?.email ? user.email.charAt(0).toUpperCase() : "👤"}
          </div>
          <div className="identity-info">
            <h2>{user?.email}</h2>
            <span className="join-date">Member since {joinDate}</span>
          </div>
        </div>
      </section>

      {/* 2. PREFERENCES */}
      <section className="profile-section">
        <h3 className="section-label">Preferences</h3>
        <div className="settings-card">
          <div className="setting-row">
            <span>Dark Mode</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isDarkMode} 
                onChange={() => setIsDarkMode(!isDarkMode)} 
              />
              <span className="slider round"></span>
            </label>
          </div>
          
          <div className="setting-row">
            <span>Weekly Goal</span>
            <span className="goal-display">{weeklyGoal || 3} workouts/week</span>
            {/* Note: You can replace the span above with an interactive counter later */}
          </div>
        </div>
      </section>

      {/* 3. FITNESS INSIGHTS */}
      <section className="profile-section">
        <h3 className="section-label">Insights</h3>
        <div className="insights-grid">
          <div className="insight-box">
            <span className="insight-value">{totalWorkouts}</span>
            <span className="insight-label">Total Workouts</span>
          </div>
          <div className="insight-box">
            <span className="insight-value">{lastWorkout}</span>
            <span className="insight-label">Last Session</span>
          </div>
          <div className="insight-box">
            <span className="insight-value">{insights.totalVolume.toLocaleString()} <small>kg</small></span>
            <span className="insight-label">Total Volume Lifted</span>
          </div>
          <div className="insight-box">
            <span className="insight-value text-sm">{insights.favoriteExercise}</span>
            <span className="insight-label">Favorite Exercise</span>
          </div>
        </div>
      </section>

      {/* 4. DANGER ZONE */}
      <section className="profile-section danger-zone-section">
        <div className="danger-card">
          <button className="logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
};

export default Profile;