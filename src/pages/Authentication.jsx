import { useState } from 'react';
import { useAuthentication } from '../context/AuthenticationContext';
import { fetchCurrentPlan, fetchWeeklyGoal, fetchWorkouts } from '../supabase/supabaseWorkoutService';
import { useWorkout } from '../context/WorkoutContext';

const Authentication = () => {
  const { user, signUp, login } = useAuthentication();
  const { setCurrentPlan, setWorkouts, setWeeklyGoal } = useWorkout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        // attempt login
        const result = await login(email, password);
        
        // try to get session from login result, otherwise fetch it explicitly
        let userId = result?.data?.session?.user?.id;
        if (!userId) {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          userId = session?.user?.id;
        }

        if (!userId) throw new Error("Failed to get user after login");

        const [workoutsData, currentPlanData, weeklyGoalData] = await Promise.all([
          fetchWorkouts(userId),
          fetchCurrentPlan(userId),
          fetchWeeklyGoal(userId),
        ]);

        setWorkouts(workoutsData || []);
        setCurrentPlan(currentPlanData || null);
        setWeeklyGoal(weeklyGoalData);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button type="submit">{mode === 'login' ? 'Login' : 'Sign Up'}</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <p onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}
      </p>
    </div>
  );
};

export default Authentication;