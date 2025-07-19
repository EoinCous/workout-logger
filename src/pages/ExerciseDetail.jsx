import '../css/ExerciseDetail.css';
import { useParams } from 'react-router-dom'
import exercisesData from '../data/exercises.json'
import { useNavigate } from 'react-router-dom'

const ExerciseDetail = () => {
  const { id } = useParams()
  const exercise = exercisesData.find((ex) => ex.id === id)

  const navigate = useNavigate()

  if (!exercise) return <p>Exercise not found.</p>

  return (
    <div className="exercise-detail">
      <button onClick={() => navigate(-1)} className="back-button">Back</button>
      <h1>{exercise.name}</h1>
      <p><strong>Muscle Group:</strong> {exercise.muscle}</p>
      <p><strong>Equipment:</strong> {exercise.equipment}</p>
      <p>{exercise.description}</p>

      <h3>Tips:</h3>
      <ul>
        {exercise.tips.map((tip, i) => <li key={i}>{tip}</li>)}
      </ul>
    </div>
  )
}

export default ExerciseDetail