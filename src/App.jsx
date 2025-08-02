import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Workout from './pages/Workout';
import Exercises from './pages/Exercises';
import History from './pages/History';
import BottomNav from './components/BottomNav';
import ExerciseDetail from './pages/ExerciseDetail';
import WorkoutPlanner from './pages/WorkoutPlanner';
import WorkoutLog from './pages/WorkoutLog';
import WorkoutSummary from './pages/WorkoutSummary';
import PersonalBests from './pages/PersonalBests';
import Suggestions from './pages/Suggestions';
import WeeklyProgress from './pages/WeeklyProgress';
import { WorkoutProvider } from './context/WorkoutContext';
import { useAuthentication } from './context/AuthenticationContext';
import Authentication from './pages/Authentication';

function App() {
  const { user, authenticationLoading } = useAuthentication();

  if (authenticationLoading) return <p>Loading...</p>;

  return user ? (
    <WorkoutProvider>
      <div className="app-container">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/workout-planner" element={<WorkoutPlanner />} />
            <Route path="/workout-log" element={<WorkoutLog />} />
            <Route path="/workout-summary/:id" element={<WorkoutSummary />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/exercise/:id" element={<ExerciseDetail />} />
            <Route path="/history" element={<History />} />
            <Route path="/personal-bests" element={<PersonalBests />} />
            <Route path="/suggestions" element={<Suggestions />} />
            <Route path="/weekly-progress" element={<WeeklyProgress />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </WorkoutProvider>
  ) : (
    <Authentication />
  );
}

export default App;