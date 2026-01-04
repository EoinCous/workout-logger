import '../css/WeeklyProgress.css';
import { useState, useMemo } from "react";
import { useWorkout } from "../context/WorkoutContext";
import {
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isWithinInterval
} from 'date-fns';
import { upsertWeeklyGoal } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';
import exercisesData from "../data/exercises.json";
import { getMuscleCategory } from '../utils/muscleGroups';

const WeeklyProgress = () => {
  const { workouts, weeklyGoal, setWeeklyGoal } = useWorkout();
  const { user } = useAuthentication();

  const [viewMode, setViewMode] = useState("week");
  const [newGoal, setNewGoal] = useState(weeklyGoal || 0);

  const dateRange = useMemo(() => {
    const today = new Date();
    return viewMode === "week"
      ? {
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 })
        }
      : {
          start: startOfMonth(today),
          end: endOfMonth(today)
        };
  }, [viewMode]);

  const filteredWorkouts = useMemo(
    () =>
      workouts.filter(w =>
        isWithinInterval(new Date(w.date), dateRange)
      ),
    [workouts, dateRange]
  );

  const stats = useMemo(() => {
    let volume = 0;
    let sets = 0;
    const muscleMap = {};
    const allMuscles = new Set();

    // 1. Collect all possible muscles from JSON for "Neglected" list
    exercisesData.forEach(ex => {
      if (ex.muscle) allMuscles.add(ex.muscle);
      if (ex.secondaryMuscles) ex.secondaryMuscles.forEach(m => allMuscles.add(m));
    });

    // 2. Aggregate Data
    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(log => {
        const def = exercisesData.find(d => d.id === log.id);
        if (!def) return;

        // Add Volume
        volume += log.sets.reduce(
          (s, set) => s + (Number(set.weight || 0) * Number(set.reps || 0)),
          0
        );
        sets += log.sets.length;

        // Helper to init muscle object
        const ensure = m => {
          if (!muscleMap[m]) {
            muscleMap[m] = { primary: new Set(), secondary: new Set() };
          }
        };

        // Track Primary
        if (def.muscle) {
          ensure(def.muscle);
          muscleMap[def.muscle].primary.add(def.name);
        }

        // Track Secondary
        def.secondaryMuscles?.forEach(m => {
          ensure(m);
          muscleMap[m].secondary.add(def.name);
        });
      });
    });

    // 3. Group muscles into Categories
    const grouped = { Push: [], Pull: [], Legs: [], Core: [], Other: [] };

    Object.entries(muscleMap).forEach(([name, data]) => {
      const entry = {
        name,
        primaryCount: data.primary.size,
        secondaryCount: data.secondary.size,
        total: new Set([...data.primary, ...data.secondary]).size
      };

      const bucket = getMuscleCategory(name);

      grouped[bucket].push(entry);
    });

    // Sort by most active
    Object.values(grouped).forEach(arr =>
      arr.sort((a, b) => b.total - a.total)
    );

    const neglected = [...allMuscles].filter(m => !muscleMap[m]).sort();

    return { volume, sets, grouped, neglected };
  }, [filteredWorkouts]);

  const calendarDays = useMemo(
    () =>
      eachDayOfInterval(dateRange).map(day => ({
        date: day,
        isActive: filteredWorkouts.some(w =>
          isSameDay(new Date(w.date), day)
        )
      })),
    [filteredWorkouts, dateRange]
  );

  const updateGoal = async () => {
    if (newGoal === weeklyGoal) return;
    try {
      await upsertWeeklyGoal(user?.id, newGoal);
      setWeeklyGoal(newGoal);
    } catch (e) {
      console.error(e);
    }
  };

  const hasActivity = Object.values(stats.grouped).some(a => a.length);

  return (
    <div className="weekly-progress-page fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">📈 Progress</h1>
        <div className="toggle-pill">
          <button
            className={viewMode === "week" ? "active" : ""}
            onClick={() => setViewMode("week")}
          >
            Week
          </button>
          <button
            className={viewMode === "month" ? "active" : ""}
            onClick={() => setViewMode("month")}
          >
            Month
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Workouts</h3>
          <p className="stat-num">{filteredWorkouts.length}</p>
        </div>
        <div className="stat-card">
          <h3>Volume</h3>
          <p className="stat-num">
            {stats.volume > 1000 
              ? `${(stats.volume / 1000).toFixed(1)}k` 
              : stats.volume}
          </p>
          <span className="stat-unit">kg</span>
        </div>
        <div className="stat-card">
          <h3>Sets</h3>
          <p className="stat-num">{stats.sets}</p>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="section-card calendar-section">
        <h3>📅 Activity</h3>
        <div className={`calendar-grid ${viewMode}`}>
          {calendarDays.map((d, i) => (
            <div
              key={i}
              className={`day-bubble ${d.isActive ? "active" : ""} ${
                isSameDay(d.date, new Date()) ? "today" : ""
              }`}
            >
              <span className="day-name">{format(d.date, "EEEEE")}</span>
              <span className="day-num">{format(d.date, "d")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Goal (Only show in Week mode) */}
      {viewMode === "week" && (
        <div className="section-card goal-section">
          <div className="goal-header">
            <h3>🎯 Weekly Goal</h3>
            <span className="goal-status">{filteredWorkouts.length} / {weeklyGoal}</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(
                  (filteredWorkouts.length / (weeklyGoal || 1)) * 100,
                  100
                )}%`
              }}
            />
          </div>
          <div className="goal-input-row">
            <input
              type="number"
              value={newGoal}
              onChange={e => setNewGoal(Number(e.target.value))}
            />
            <button onClick={updateGoal}>Set Goal</button>
          </div>
        </div>
      )}

      {/* Muscle Usage Tables */}
      <div className="section-card">
        <h3>💪 Muscle Usage</h3>
        <p className="subtitle">Breakdown by unique exercises</p>
        {hasActivity ? (
          <div className="tables-container">
            {Object.entries(stats.grouped).map(([cat, muscles]) =>
              muscles.length ? (
                <div key={cat} className="category-table-wrapper">
                  <h4 className={`cat-header`}>{cat}</h4>
                  <table className="muscle-table">
                    <thead>
                      <tr>
                        <th className="th-left">Muscle</th>
                        <th>Primary</th>
                        <th>Secondary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {muscles.map(m => (
                        <tr key={m.name}>
                          <td className="td-name">{m.name.replace("_", " ")}</td>
                          <td className="td-val">
                             {m.primaryCount > 0 ? <span className="p-badge">{m.primaryCount}</span> : "-"}
                          </td>
                          <td className="td-val">
                             {m.secondaryCount > 0 ? <span className="s-badge">{m.secondaryCount}</span> : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null
            )}
          </div>
        ) : (
          <p className="empty-msg">No workouts logged this period.</p>
        )}
      </div>

      {stats.neglected.length > 0 && (
        <div className="section-card neglected-card">
          <h3>🚫 Neglected Muscles</h3>
          <div className="neglected-flex">
            {stats.neglected.map(m => (
              <span key={m} className="neglected-tag">
                {m.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyProgress;