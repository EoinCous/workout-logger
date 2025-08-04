import { NavLink } from 'react-router-dom'
import '../css/BottomNav.css'

const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span role="img" aria-label="home">🏠</span>
        <p>Home</p>
      </NavLink>
      <NavLink to="/workout" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span role="img" aria-label="workout">🏋️</span>
        <p>Workout</p>
      </NavLink>
      <NavLink to="/exercises" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span role="img" aria-label="exercises">📚</span>
        <p>Exercises</p>
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span role="img" aria-label="history">📅</span>
        <p>History</p>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <span role="img" aria-label="profile">📅</span>
        <p>Profile</p>
      </NavLink>
    </nav>
  )
}

export default BottomNav