import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Exercises from './pages/Exercises'
import History from './pages/History'
import BottomNav from './components/BottomNav'
import ExerciseDetail from './pages/ExerciseDetail'
import { WorkoutProvider } from './context/WorkoutContext'
import WorkoutPlanner from './pages/WorkoutPlanner'
import WorkoutLog from './pages/WorkoutLog'
import WorkoutSummary from './pages/WorkoutSummary'
import PersonalBests from './pages/PersonalBests'
import Suggestions from './pages/Suggestions'
import WeeklyProgress from './pages/WeeklyProgress'

function App() {
  return (
    <WorkoutProvider>
      <div className="app-container">
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/workout-planner" element={<WorkoutPlanner />} />
            <Route path="/workout-log" element={<WorkoutLog />} />
            <Route path="/workout-summary/:date" element={<WorkoutSummary />} />
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
  )
}

export default App