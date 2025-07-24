import '../css/Exercises.css';
import { useState } from 'react';
import exercisesData from '../data/exercises.json';
import ExerciseCard from '../components/ExerciseCard';

const Exercises = () => {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('All Muscles');

  const muscles = ['All Muscles', ...new Set(exercisesData.map(ex => ex.muscle))];

  const filteredExercises = exercisesData.filter(ex => {
    const matchesMuscle = selectedMuscle === 'All Muscles' || ex.muscle === selectedMuscle;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    return matchesMuscle && matchesSearch;
  });

  return (
    <div className="exercises-page">
      <h1 className="page-title">📋 Exercises</h1>

      <div className="filters">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
          className="muscle-select"
        >
          {muscles.map((muscle) => (
            <option key={muscle} value={muscle}>
              {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="exercise-list">
        {filteredExercises.length === 0 ? (
          <p className="no-results">No exercises found.</p>
        ) : (
          filteredExercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))
        )}
      </div>
    </div>
  );
};

export default Exercises;