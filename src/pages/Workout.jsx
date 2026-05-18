import '../css/Workout.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import { WORKOUT_STATUS } from "../constants/workoutStatus";
import { hydrateExercises } from '../utils/exerciseUtils';
import { deleteTemplate } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';

const Workout = () => {
  const { status, setCurrentPlan, getLatestWorkouts, setStatus, templates, setTemplates } = useWorkout();
  const { user } = useAuthentication();
  const latestWorkouts = getLatestWorkouts();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState({});
  const [expandedTemplates, setExpandedTemplates] = useState({});

  useEffect(() => {
    if (status === WORKOUT_STATUS.PLANNING || status === WORKOUT_STATUS.PLANNED) {
      navigate("/workout-planner");
    } else if (status === WORKOUT_STATUS.IN_PROGRESS) {
      navigate("/workout-log");
    }
  }, [status, navigate]);

  const handlePlanWorkout = () => {
    setStatus(WORKOUT_STATUS.PLANNING);
    navigate("/workout-planner");
  };

  const handleStartTemplate = (template) => {
    const hydrated = hydrateExercises(template.exercises);
    setCurrentPlan({
      type: template.type || "full",
      exercises: hydrated,
      date: new Date().toISOString()
    });
    setStatus(WORKOUT_STATUS.PLANNING);
    navigate("/workout-planner");
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(user.id, templateId);
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } catch (error) {
        console.error("Failed to delete template:", error);
        alert("Failed to delete template. Please try again.");
      }
    }
  };

  const toggleTemplateExpand = (id) => {
    setExpandedTemplates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (status === WORKOUT_STATUS.COMPLETE || status === WORKOUT_STATUS.IDLE) {
    return (
      <div className="workout-page-container fade-in">
          <h1 className='page-title'>🏋️ Workout</h1>

        <button className="plan-btn" onClick={handlePlanWorkout}>Plan Custom Workout</button>

        {/* Template Section */}
        {templates.length > 0 && (
          <section className="templates-section">
            <h2>Templates</h2>
            <div className="template-list">
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header-row">
                    <div className="template-title-click" onClick={() => toggleTemplateExpand(template.id)}>
                      <h3>{template.name}</h3>
                      <span className={`chevron ${expandedTemplates[template.id] ? "open" : ""}`}>
                        {/* Custom SVG Chevron for better scaling */}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </span>
                    </div>
                    <button className="start-template-btn" onClick={() => handleStartTemplate(template)}>
                      Plan
                    </button>
                  </div>

                  {expandedTemplates[template.id] && (
                    <div className="template-details fade-in-fast">
                      <div className="template-exercises-list">
                        {hydrateExercises(template.exercises).map((ex, i) => (
                          <div key={ex.id || i} className="template-exercise-item">
                            <span className="ex-name">{ex.name}</span>
                          </div>
                        ))}
                      </div>
                      <button className="delete-template-btn" onClick={() => handleDeleteTemplate(template.id)}>
                        Delete Template
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- LATEST WORKOUTS SECTION --- */}
        {latestWorkouts && latestWorkouts.length > 0 && (
          <section className='latest-workouts-section'>
            <h2>Recent History</h2>
            <div className="latest-workouts-list">
              {latestWorkouts.map((workout) => (
                <div key={workout.id} className="workout-history-card">
                  <div className="workout-header" onClick={() => toggleExpand(workout.id)}>
                    <div className="workout-header-info">
                      <h3>{workout.type}</h3>
                      <span className="workout-date">
                        {new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`chevron ${expanded[workout.id] ? "open" : ""}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </span>
                  </div>

                  {expanded[workout.id] && (
                    <div className="workout-details fade-in-fast">
                      {hydrateExercises(workout.exercises).map((ex) => (
                        <div key={ex.id} className="exercise-summary">
                          <h4>{ex.name}</h4>
                          <div className="set-pill-container">
                            {ex.sets.map((set, index) => (
                              <span key={index} className="set-pill">
                                {set.weight}kg x {set.reps}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
        
        {!latestWorkouts?.length && templates.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <p>No workouts or templates yet.</p>
            <span className="empty-subtext">Click 'Start Empty Workout' to begin your journey.</span>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Workout;