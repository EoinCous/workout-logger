import '../css/Exercises.css';
import { useState, useMemo } from 'react';
import exercisesData from '../data/exercises.json';
import ExerciseCard from '../components/ExerciseCard';
import SearchInput from '../components/SearchInput';
import { MUSCLE_CATEGORIES } from '../utils/muscleGroups';

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
      <div className="exercise-page-heading">
        <h1 className="page-title">Exercise Library</h1>
        <p className="exercise-result-count" aria-live="polite">
          {filteredData.length} {filteredData.length === 1 ? 'exercise' : 'exercises'}
        </p>
      </div>

      <div className="controls-section">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search exercises..."
        />

        <div className="category-pills" role="group" aria-label="Filter by workout category">
          {categories.map(cat => (
            <button
              key={cat}
              className={`pill-btn ${activeCategory === cat ? 'active' : ''}`}
              aria-pressed={activeCategory === cat}
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
            <section key={muscle} className="muscle-group-section">
              <div className="muscle-group-heading">
                <h2 className="header-title">{muscle.replace('_', ' ')}</h2>
                <span className="header-count">
                  {groupedExercises[muscle].length} {groupedExercises[muscle].length === 1 ? 'exercise' : 'exercises'}
                </span>
              </div>

              <div className="cards-grid">
                {groupedExercises[muscle].map(exercise => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="no-results">
            <p>
              {search
                ? `No exercises found for "${search}" in ${activeCategory}.`
                : `No exercises found in ${activeCategory}.`}
            </p>
            <button
              className="clear-filters-btn"
              onClick={() => {
                setSearch('');
                setActiveCategory('All');
              }}
            >
              Clear filters
            </button>
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