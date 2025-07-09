import exercisesData from '../data/exercises.json'
import ExerciseCard from '../components/ExerciseCard'

const Exercises = () => {
  // Group by muscle
  const grouped = exercisesData.reduce((acc, ex) => {
    acc[ex.muscle] = acc[ex.muscle] || []
    acc[ex.muscle].push(ex)
    return acc
  }, {})

  return (
    <div>
      <h1>Exercises</h1>
      {Object.keys(grouped).map((muscle) => (
        <div key={muscle}>
          <h2>{muscle.charAt(0).toUpperCase() + muscle.slice(1)}</h2>
          {grouped[muscle].map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default Exercises