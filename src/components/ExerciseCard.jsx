import { Link } from 'react-router-dom'
import '../css/ExerciseCard.css'

const ExerciseCard = ({ exercise }) => {
  return (
    <Link to={`/exercise/${exercise.id}`}>
      <div className="exercise-card">
        <h3>{exercise.name}</h3>
        <p>{exercise.muscle}</p>
      </div>
    </Link>
  )
}

export default ExerciseCard