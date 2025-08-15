import '../css/ExerciseDetail.css';
import { useParams, useLocation } from 'react-router-dom';
import exercisesData from '../data/exercises.json';
import BackButton from '../components/BackButton';
import { useWorkout } from '../context/WorkoutContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

const ExerciseDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const previousPage = location.state?.from || 'exercises';
  const { workouts } = useWorkout();
  const exercise = exercisesData.find((exercise) => exercise.id === id);

  const chartData = useMemo(() => {
    const dataByDate = {};

    workouts.reverse().forEach(workout => {
      const date = new Date(workout.date).toLocaleDateString();

      workout.exercises.forEach(exercise => {
        if (exercise.id === id) {
          let totalWeight = 0;
          let totalVolume = 0;
          let count = 0;

          exercise.sets.forEach(set => {
            const weight = parseFloat(set.weight);
            const reps = parseInt(set.reps, 10);

            if (!isNaN(weight) && !isNaN(reps)) {
              totalWeight += weight;
              totalVolume += weight * reps;
              count++;
            }
          });

          if (count > 0) {
            if (!dataByDate[date]) {
              dataByDate[date] = { date, totalWeight: 0, totalVolume: 0, count: 0 };
            }

            dataByDate[date].totalWeight += totalWeight;
            dataByDate[date].totalVolume += totalVolume;
            dataByDate[date].count += count;
          }
        }
      });
    });

    return Object.values(dataByDate)
      .map(({ date, totalWeight, totalVolume, count }) => ({
        date,
        avgWeight: +(totalWeight / count).toFixed(2),
        totalVolume,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // chronological
  }, [workouts, id]);

  if (!exercise) return <p>Exercise not found.</p>;

  return (
    <div className="exercise-detail">
      <BackButton previousPage={previousPage} />
      <h1 className='page-title'>{exercise.name}</h1>
      <p><strong>Muscle Group:</strong> {exercise.muscle}</p>
      <p><strong>Equipment:</strong> {exercise.equipment}</p>
      <p>{exercise.description}</p>

      <h3>Tips:</h3>
      <ul>
        {exercise.tips.map((tip, i) => <li key={i}>{tip}</li>)}
      </ul>

      {chartData.length > 0 && (
        <div className="charts-container">
          <h3>📈 Average Weight Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgWeight" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>

          <h3>🏋️ Total Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalVolume" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ExerciseDetail;