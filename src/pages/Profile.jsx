import { useAuthentication } from "../context/AuthenticationContext";
import { useWorkout } from "../context/WorkoutContext";
import '../css/Profile.css';

const Profile = () => {
  const { user, logout } = useAuthentication();
  const { workouts, weeklyGoal, resetWorkoutData } = useWorkout();

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

  return (
    <div className="profile-page">
      <h1 className="page-title">Profile 👤</h1>
      <div className="profile-card">
        <p><strong>User Email:</strong> {user?.email}</p>
        <p><strong>Total Workouts:</strong> {totalWorkouts}</p>
        <p><strong>Weekly Goal:</strong> {weeklyGoal || "Not set"}</p>
        <p><strong>Last Workout:</strong> {lastWorkout}</p>
      </div>
      
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Profile;