import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import { useAuthentication } from './context/AuthenticationContext';
import LoadingScreen from './components/LoadingScreen';

const Home = lazy(() => import('./pages/Home'));
const Workout = lazy(() => import('./pages/Workout'));
const Exercises = lazy(() => import('./pages/Exercises'));
const History = lazy(() => import('./pages/History'));
const ExerciseDetail = lazy(() => import('./pages/ExerciseDetail'));
const WorkoutPlanner = lazy(() => import('./pages/WorkoutPlanner'));
const WorkoutLog = lazy(() => import('./pages/WorkoutLog'));
const WorkoutSummary = lazy(() => import('./pages/WorkoutSummary'));
const PersonalBests = lazy(() => import('./pages/PersonalBests'));
const Suggestions = lazy(() => import('./pages/Suggestions'));
const WeeklyProgress = lazy(() => import('./pages/WeeklyProgress'));
const Authentication = lazy(() => import('./pages/Authentication'));
const Profile = lazy(() => import('./pages/Profile'));
const OneRepMax = lazy(() => import('./pages/OneRepMax'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const NotFound = lazy(() => import('./pages/NotFound'));

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
    <Suspense fallback={<LoadingScreen message="Loading page" />}>
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/one-rep-max" element={<OneRepMax />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        ) : (
          <Route path="*" element={<Authentication />} />
        )}
      </Routes>
    </Suspense>
  );
}

export default App;