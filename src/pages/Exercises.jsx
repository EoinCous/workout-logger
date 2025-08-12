import '../css/Exercises.css';
import { useState } from 'react';
import exercisesData from '../data/exercises.json';
import ExerciseCard from '../components/ExerciseCard';
import SearchInput from '../components/SearchInput';

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
        <SearchInput
          value={search}
          onChange={setSearch}
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
        {filteredExercises.length > 0 ? (
          filteredExercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))
        ) : (
          <p className="no-results">
            No exercises found. 
            Try search in "all muscles". 
            If it's not there, 
            you can request the addition of your exercise through the suggestions form in the Home page.
          </p>
        )}
      </div>
    </div>
  );
};

export default Exercises;