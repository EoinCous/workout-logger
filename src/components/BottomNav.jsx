import { NavLink } from 'react-router-dom'
import '../css/BottomNav.css'

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className="nav-item">
        <span role="img" aria-label="home">🏠</span>
        <p>Home</p>
      </NavLink>
      <NavLink to="/workout" className="nav-item">
        <span role="img" aria-label="workout">🏋️</span>
        <p>Workout</p>
      </NavLink>
      <NavLink to="/exercises" className="nav-item">
        <span role="img" aria-label="exercises">📚</span>
        <p>Exercises</p>
      </NavLink>
      <NavLink to="/history" className="nav-item">
        <span role="img" aria-label="history">📅</span>
        <p>History</p>
      </NavLink>
    </nav>
  )
}

export default BottomNav