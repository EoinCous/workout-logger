import { useState } from 'react';
import { useAuthentication } from '../context/AuthenticationContext';
import { fetchCurrentPlan, fetchWeeklyGoal, fetchWorkouts } from '../supabase/supabaseWorkoutService';
import { useWorkout } from '../context/WorkoutContext';
import '../css/Authentication.css';
import { useNavigate } from 'react-router-dom';

const Authentication = () => {
  const { signUp, login } = useAuthentication();
  const { setCurrentPlan, setWorkouts, setWeeklyGoal } = useWorkout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    try {
      if (mode === 'login') {
        const result = await login(email, password);

        const userId = result.user.id;
        if (!userId) throw new Error("Failed to get user after login");

        navigate('/');

        const [workoutsData, currentPlanData, weeklyGoalData] = await Promise.all([
          fetchWorkouts(userId),
          fetchCurrentPlan(userId),
          fetchWeeklyGoal(userId),
        ]);

        setWorkouts(workoutsData || []);
        setCurrentPlan(currentPlanData || null);
        setWeeklyGoal(weeklyGoalData || null);
      } else {
        await signUp(email, password);
        alert(`We’ve sent a verification link to ${email}. Please open your inbox and click the link to confirm your email.`)
      }
    } catch (err) {
      console.error(err || 'Something went wrong.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" aria-label="Authentication card">
        <div className="auth-brand">
          <img
            src="/images/replog-icon-1.png"
            alt="RepLog"
            className="loading-logo"
          />
          <div className="auth-subtitle">
            {mode === 'login' ? 'Welcome back, log your workout.' : 'Create your account to start logging.'}
          </div>
        </div>

        <form onSubmit={handleSubmit} aria-label="Authentication form">
          <input
            aria-label="Email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            aria-label="Password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">
            {mode === 'login' ? 'Login' : 'Sign Up'}
          </button>
        </form>

        {error && (
          <div className="error-box" role="alert">
            <div className="small">⚠️</div>
            <div>{error}</div>
          </div>
        )}

        <div className="switch-mode">
          {mode === 'login' ? (
            <>
              <span>New to RepLog? </span>
              <button type="button" onClick={() => setMode('signup')}>
                Sign up
              </button>
            </>
          ) : (
            <>
              <span>Already have an account? </span>
              <button type="button" onClick={() => setMode('login')}>
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authentication;