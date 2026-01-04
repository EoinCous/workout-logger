import '../css/Exercises.css';
import { useState, useMemo } from 'react';
import exercisesData from '../data/exercises.json';
import ExerciseCard from '../components/ExerciseCard';
import SearchInput from '../components/SearchInput';
import { MUSCLE_CATEGORIES } from '../utils/muscleGroups'; // Import your utility

const Exercises = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Flatten logic for "All" view + add the specific categories
  const categories = ['All', 'Push', 'Pull', 'Legs', 'Core'];

  // 1. Filter Data
  const filteredData = useMemo(() => {
    let data = exercisesData;

    // Filter by Category (Push/Pull/etc)
    if (activeCategory !== 'All') {
      const allowedMuscles = MUSCLE_CATEGORIES[activeCategory] || [];
      data = data.filter(ex => allowedMuscles.includes(ex.muscle));
    }

    // Filter by Search
    if (search) {
      data = data.filter(ex => 
        ex.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return data;
  }, [search, activeCategory]);

  // 2. Group Data by Muscle (e.g., { Chest: [...], Shoulders: [...] })
  const groupedExercises = useMemo(() => {
    const groups = {};
    
    filteredData.forEach(ex => {
      if (!groups[ex.muscle]) {
        groups[ex.muscle] = [];
      }
      groups[ex.muscle].push(ex);
    });

    // Sort exercises alphabetically within their group
    Object.keys(groups).forEach(muscle => {
      groups[muscle].sort((a, b) => a.name.localeCompare(b.name));
    });

    return groups;
  }, [filteredData]);

  // Get sorted muscle names for rendering order
  const sortedMuscleGroups = Object.keys(groupedExercises).sort();

  return (
    <div className="exercises-page fade-in">
      <h1 className="page-title">📋 Exercise Library</h1>

      <div className="controls-section">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search exercises..."
        />

        {/* Pill Filters */}
        <div className="category-pills">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="exercise-list-container">
        {sortedMuscleGroups.length > 0 ? (
          sortedMuscleGroups.map(muscle => (
            <div key={muscle} className="muscle-group-section">
              {/* Sticky Header */}
              <div className="muscle-sticky-header">
                <span className="header-title">{muscle.replace('_', ' ')}</span>
                <span className="header-count">{groupedExercises[muscle].length}</span>
              </div>
              
              {/* Cards Grid */}
              <div className="cards-grid">
                {groupedExercises[muscle].map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No exercises found for "{search}" in {activeCategory}.</p>
            <p className="sub-text">
               Don't see your exercise? You can request it via the Suggestions form on the Home page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exercises;