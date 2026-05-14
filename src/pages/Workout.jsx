import '../css/Workout.css';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkout } from "../context/WorkoutContext";
import { WORKOUT_STATUS } from "../constants/workoutStatus";
import { hydrateExercises } from '../utils/exerciseUtils';
import { fetchTemplates, deleteTemplate } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';

const Workout = () => {
  const {
    status,
    setCurrentPlan,
    getLatestWorkouts,
    setStatus,
  } = useWorkout();

  const { user } = useAuthentication();
  const latestWorkouts = getLatestWorkouts();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState({});
  const [templates, setTemplates] = useState([]);
  const [expandedTemplates, setExpandedTemplates] = useState({});

  // 1. Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (user?.id) {
        try {
          const data = await fetchTemplates(user.id);
          setTemplates(data || []);
        } catch (error) {
          console.error("Failed to load templates:", error);
        }
      }
    };
    loadTemplates();
  }, [user]);

  // Handle status routing
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
    setExpandedTemplates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id], 
    }));
  };

  if (status === WORKOUT_STATUS.COMPLETE || status === WORKOUT_STATUS.IDLE) {
    return (
      <div className="workout-page-container fade-in">
        <h1 className='page-title'>🏋️ Workout</h1>

        {/* --- TEMPLATES SECTION (Quick Start) --- */}
        {templates.length > 0 && (
          <div className="templates-section">
            <h2>Quick Start</h2>
            <div className="template-list">
              {templates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="template-header-row">
                    <div 
                      className="template-title-click"
                      onClick={() => toggleTemplateExpand(template.id)}
                    >
                      <h3>{template.name}</h3>
                      <span className="expand-icon">{expandedTemplates[template.id] ? "▾" : "▸"}</span>
                    </div>
                    <div className="template-actions">
                      <button 
                        className="start-template-btn" 
                        onClick={() => handleStartTemplate(template)}
                      >
                        Start
                      </button>
                    </div>
                  </div>

                  {expandedTemplates[template.id] && (
                    <div className="template-details">
                      <div className="template-exercises-list">
                        {hydrateExercises(template.exercises).map((ex, i) => (
                          <div key={ex.id || i} className="template-exercise-item">
                            <span className="ex-dot">•</span>
                            <span className="ex-name">{ex.name}</span>
                          </div>
                        ))}
                      </div>
                      <button 
                        className="delete-template-btn"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        🗑️ Delete Template
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="plan-btn" onClick={handlePlanWorkout}>
           Plan Custom Workout
        </button>

        {/* --- LATEST WORKOUTS SECTION --- */}
        {latestWorkouts && latestWorkouts.length > 0 && (
          <div className='latest-workouts'>
            <h2>Latest Workouts</h2>
            {latestWorkouts.map((workout) => (
              <div key={workout.id} className="last-workout-summary">
                <div
                  className="workout-header"
                  onClick={() => toggleExpand(workout.id)}
                >
                  <h3>{workout.type} — {new Date(workout.date).toLocaleDateString()}</h3>
                  <h3>{expanded[workout.id] ? "▸" : "▾"}</h3>
                </div>

                {expanded[workout.id] && (
                  <div className="workout-details">
                    {hydrateExercises(workout.exercises).map((ex) => (
                      <div key={ex.id} className="exercise-summary">
                        <h4>{ex.name}</h4>
                        <ul>
                          {ex.sets.map((set, index) => (
                            <li key={index}>
                              {set.reps} reps @ {set.weight}kg
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {!latestWorkouts?.length && templates.length === 0 && (
          <div className="empty-state">
            <p>No workouts or templates yet. Start building your routine!</p>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default Workout;