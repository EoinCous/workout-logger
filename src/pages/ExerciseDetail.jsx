import '../css/ExerciseDetail.css';
import { useParams, useLocation } from 'react-router-dom';
import exercisesData from '../data/exercises.json';
import BackButton from '../components/BackButton';
import { useWorkout } from '../context/WorkoutContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { useMemo, useState } from 'react';

const ExerciseDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const previousPage = location.state?.from || 'exercises';
  const { workouts } = useWorkout();
  const [chartView, setChartView] = useState('strength'); // 'strength' or 'volume'

  const exercise = exercisesData.find((ex) => ex.id === id);

  // Advanced Data Processing
  const { chartData, personalRecord, totalSetsAllTime } = useMemo(() => {
    if (!exercise) return { chartData: [], personalRecord: 0, totalSetsAllTime: 0 };

    const statsByDate = {};
    let globalMaxWeight = 0;
    let globalTotalSets = 0;

    // Sort workouts chronologically first to ensure graph line flows correctly
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedWorkouts.forEach(workout => {
      // Find the specific exercise in this workout
      const exerciseLog = workout.exercises.find(e => e.id === id);
      if (!exerciseLog) return;

      const dateStr = new Date(workout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      let sessionVolume = 0;
      let sessionMax1RM = 0;

      exerciseLog.sets.forEach(set => {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps, 10) || 0;
        
        if (weight > 0 && reps > 0) {
          globalTotalSets++;
          
          // Calculate Volume
          sessionVolume += weight * reps;

          // Calculate Estimated 1RM (Epley Formula)
          const e1rm = weight * (1 + reps / 30);
          if (e1rm > sessionMax1RM) sessionMax1RM = e1rm;

          // Check for absolute heaviest weight lifted (PR)
          if (weight > globalMaxWeight) globalMaxWeight = weight;
        }
      });

      if (sessionVolume > 0) {
        // If multiple sessions in one day, merge them (rare but possible)
        if (statsByDate[dateStr]) {
            statsByDate[dateStr].volume += sessionVolume;
            statsByDate[dateStr].strength = Math.max(statsByDate[dateStr].strength, sessionMax1RM);
        } else {
            statsByDate[dateStr] = { 
                date: dateStr, 
                volume: sessionVolume, 
                strength: Math.round(sessionMax1RM) 
            };
        }
      }
    });

    return {
      chartData: Object.values(statsByDate),
      personalRecord: globalMaxWeight,
      totalSetsAllTime: globalTotalSets
    };
  }, [workouts, id, exercise]);

  if (!exercise) return <div className="error-state">Exercise not found.</div>;

  return (
    <div className="exercise-detail fade-in">
      <div className="header-section">
        <BackButton previousPage={previousPage} />
        <h1 className='page-title'>{exercise.name}</h1>
        <div className="chip-container">
          <span className="chip primary">{exercise.muscle}</span>
          {exercise.trackingType && <span className="chip type">{exercise.trackingType}</span>}
        </div>
      </div>

      {/* 1. Quick Stats Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Personal Record</span>
          <span className="stat-value">{personalRecord} <span className="unit">kg</span></span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Sets</span>
          <span className="stat-value">{totalSetsAllTime}</span>
        </div>
        <div className="stat-card">
            <span className="stat-label">Equipment</span>
            <span className="stat-value-sm">{exercise.equipment}</span>
        </div>
      </div>

      {/* 2. Charts Section with Tabs */}
      {chartData.length > 0 ? (
        <div className="chart-section">
          <div className="chart-header">
            <h3>Progress</h3>
            <div className="toggle-pill">
                <button 
                    className={chartView === 'strength' ? 'active' : ''} 
                    onClick={() => setChartView('strength')}
                >
                    Strength (1RM)
                </button>
                <button 
                    className={chartView === 'volume' ? 'active' : ''} 
                    onClick={() => setChartView('volume')}
                >
                    Volume
                </button>
            </div>
          </div>
          
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
                {chartView === 'strength' ? (
                 <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#888" />
                    <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} stroke="#888" />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#222', border: 'none', borderRadius: '8px'}}
                        itemStyle={{color: '#fff'}}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="strength" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{r: 4, fill: '#3b82f6'}} 
                        activeDot={{r: 6}} 
                    />
                 </LineChart>
                ) : (
                 <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#888" />
                    <YAxis tick={{fontSize: 12}} stroke="#888" />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#222', border: 'none', borderRadius: '8px'}}
                        itemStyle={{color: '#fff'}}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#10b981" 
                        fillOpacity={1} 
                        fill="url(#colorVol)" 
                    />
                 </AreaChart>
                )}
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="empty-chart">Log this exercise to see your progress!</div>
      )}

      {/* 3. Info Section */}
      <div className="info-section">
        
        {/* Placeholder for where a muscle diagram would go */}
        {/*  */}
        
        <div className="secondary-muscles">
            <h4>Secondary Muscles</h4>
            <div className="chip-container">
                {exercise.secondaryMuscles?.map(m => (
                    <span key={m} className="chip secondary">{m}</span>
                ))}
            </div>
        </div>

        <div className="tips-container">
            <h3>💡 Form Tips</h3>
            <ul>
                {exercise.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
        </div>
        
        <div className="description-box">
            <h4>Description</h4>
            <p>{exercise.description}</p>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;