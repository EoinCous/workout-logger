import { useLocation } from 'react-router-dom';
import '../css/WorkoutSummary.css';
import BackButton from '../components/BackButton';
import { hydrateExercises } from '../utils/exerciseUtils';
import { useMemo, useState } from 'react';
import { useAuthentication } from '../context/AuthenticationContext';
import { insertTemplate } from '../supabase/supabaseWorkoutService';

const WorkoutSummary = () => {
  const location = useLocation();
  const workout = location.state?.workout;
  
  const { user } = useAuthentication(); 

  const [showTemplateInput, setShowTemplateInput] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState({ type: '', message: '' });

  const hydratedExercises = useMemo(() => {
    return workout ? hydrateExercises(workout.exercises) : [];
  }, [workout]);

  const stats = useMemo(() => {
    if (!workout) return { volume: 0, sets: 0, duration: 0 };

    const durationMs = new Date(workout.completedAt) - new Date(workout.date);
    const durationMins = Math.round(durationMs / 1000 / 60);

    let totalVolume = 0;
    let totalSets = 0;

    hydratedExercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalSets++;
        if (set.weight && set.reps) {
          totalVolume += parseFloat(set.weight) * parseFloat(set.reps);
        }
      });
    });

    return { volume: totalVolume, sets: totalSets, duration: durationMins };
  }, [workout, hydratedExercises]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    setIsSavingTemplate(true);
    setTemplateFeedback({ type: '', message: '' });

    try {
      const templateExercises = workout.exercises.map(ex => ({
        id: ex.id,
      }));
      const templateType = workout.type;

      const newTemplate = {
        name: templateName.trim(),
        exercises: templateExercises,
        type: templateType
      };

      await insertTemplate(user?.id, newTemplate);

      setTemplateFeedback({ type: 'success', message: 'Template saved successfully!' });
      setShowTemplateInput(false);
    } catch (error) {
      console.error(error);
      setTemplateFeedback({ 
        type: 'error', 
        message: 'Failed to save. You may have reached the 5 template limit.' 
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  if (!workout) {
    return (
      <div className="summary-page">
        <BackButton previousPage={'/history'} />
        <p className="not-found">Workout not found.</p>
      </div>
    );
  }

  const formattedDate = new Date(workout.date).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="summary-page fade-in">
      <BackButton previousPage={'/history'} />
      
      <div className="summary-container">
        <header className="summary-header">
          <div className="header-top">
            <span className="workout-date">{formattedDate}</span>
          </div>
          <h2 className="workout-title">{workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Workout</h2>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Duration</span>
            <span className="stat-value">{stats.duration}<span className="stat-unit">m</span></span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Volume</span>
            <span className="stat-value">{stats.volume}<span className="stat-unit">kg</span></span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Sets</span>
            <span className="stat-value">{stats.sets}</span>
          </div>
        </div>

        {/* Personal Bests Section */}
        {workout.personalBests && Object.keys(workout.personalBests).length > 0 && (
          <div className="new-pbs">
            <h3>🏆 Personal Best</h3>
            <div className="pb-grid">
              {Object.values(workout.personalBests).map(pb => (
                <div key={pb.name} className="pb-card">
                  <span className="pb-exercise">{pb.name}</span>
                  <span className="pb-value">{pb.weight}kg × {pb.reps}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exercise List */}
        <div className="exercise-list">
          {hydratedExercises.map((ex, i) => (
            <div key={ex.id || i} className="exercise-summary-card">
              <div className="ex-header">
                <span className="ex-number">{i + 1}</span>
                <h3 className='exercise-name'>{ex.name}</h3>
              </div>

              <div className="sets-table">
                <div className="sets-header">
                  <span>Set</span>
                  <span>kg</span>
                  <span>Reps</span>
                </div>
                {ex.sets.map((set, setIndex) => (
                  <div key={setIndex} className="set-row">
                    <span className="set-num">{setIndex + 1}</span>
                    <span className="set-weight">{set.weight || '-'}</span>
                    <span className="set-reps">{set.reps}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Notes Section */}
        {workout.notes && (
          <div className="workout-notes-summary">
            <h3>📝 Notes</h3>
            <p>{workout.notes}</p>
          </div>
        )}

        {/* Template Section */}
        <div className="template-save-section">
          {!showTemplateInput && templateFeedback.type !== 'success' && (
            <button 
              className="save-template-trigger-btn"
              onClick={() => setShowTemplateInput(true)}
            >
              💾 Save Workout as Template
            </button>
          )}

          {showTemplateInput && (
            <div className="template-input-container">
              <input
                type="text"
                placeholder="Name this template (e.g., Heavy Legs)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                maxLength={30}
                autoFocus
              />
              <div className="template-actions">
                <button 
                  className="confirm-template-btn"
                  onClick={handleSaveTemplate}
                  disabled={isSavingTemplate || !templateName.trim()}
                >
                  {isSavingTemplate ? "Saving..." : "Save"}
                </button>
                <button 
                  className="cancel-template-btn"
                  onClick={() => setShowTemplateInput(false)}
                  disabled={isSavingTemplate}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {templateFeedback.message && (
            <p className={`template-feedback-msg ${templateFeedback.type}`}>
              {templateFeedback.message}
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default WorkoutSummary;