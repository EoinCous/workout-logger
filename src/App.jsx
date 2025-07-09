import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Exercises from './pages/Exercises'
import History from './pages/History'
import BottomNav from './components/BottomNav'

function App() {
  return (
    <div className="app-container">
      <div className="page-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workout" element={<Workout />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  )
}

export default App