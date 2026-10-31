import { Routes, Route, Outlet } from 'react-router-dom';
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
import { useAuthentication } from './context/AuthenticationContext';
import Authentication from './pages/Authentication';
import Profile from './pages/Profile';
import OneRepMax from './pages/OneRepMax';
import UpdatePassword from './pages/UpdatePassword';
import LoadingScreen from './components/LoadingScreen';
import NotFound from './pages/NotFound';

const AuthenticatedLayout = () => (
  <div className="app-container">
    <div className="page-content">
      <Outlet />
    </div>
    <BottomNav />
  </div>
);

function App() {
  const { user, authenticationLoading } = useAuthentication();

  if (authenticationLoading) return <LoadingScreen message="Checking your session" />;

  return (
    <Routes>
      <Route path="/update-password" element={<UpdatePassword />} />
      {user ? (
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/workout-planner" element={<WorkoutPlanner />} />
          <Route path="/workout-log" element={<WorkoutLog />} />
          <Route path="/workout-summary" element={<WorkoutSummary />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/exercise/:id" element={<ExerciseDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/personal-bests" element={<PersonalBests />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/weekly-progress" element={<WeeklyProgress />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/one-rep-max' element={<OneRepMax />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      ) : (
        <Route path="*" element={<Authentication />} />
      )}
    </Routes>
  );
}

export default App;