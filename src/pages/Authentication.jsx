import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../context/AuthenticationContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  fetchCurrentPlan,
  fetchTemplates,
  fetchWeeklyGoal,
  fetchWorkouts,
} from '../supabase/supabaseWorkoutService';
import '../css/Authentication.css';

const getErrorMessage = (error, mode) => {
  const message = error?.message?.toLowerCase();

  if (message?.includes('invalid login credentials')) {
    return 'Email or password is incorrect. Please try again.';
  }
  if (message?.includes('user already registered')) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  if (message?.includes('email not confirmed')) {
    return 'Please confirm your email before logging in.';
  }

  return error?.message || (mode === 'login'
    ? 'Unable to log in. Please try again.'
    : 'Unable to create your account. Please try again.');
};

const Authentication = () => {
  const { signUp, login, resetPassword } = useAuthentication();
  const { setCurrentPlan, setWorkouts, setWeeklyGoal, setTemplates } = useWorkout();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (mode === 'forgotPassword') {
        await resetPassword(email.trim());
        setSuccess(
          "If an account exists for this email, we'll send a password reset link. Check your inbox."
        );
      } else if (mode === 'login') {
        const result = await login(email.trim(), password);
        const userId = result?.user?.id;
        if (!userId) throw new Error('Unable to verify your account. Please try again.');

        const [workouts, currentPlan, weeklyGoal, templates] = await Promise.all([
          fetchWorkouts(userId),
          fetchCurrentPlan(userId),
          fetchWeeklyGoal(userId),
          fetchTemplates(userId),
        ]);

        setWorkouts(workouts || []);
        setCurrentPlan(currentPlan || null);
        setWeeklyGoal(weeklyGoal || null);
        setTemplates(templates || []);
        navigate('/');
      } else {
        await signUp(email.trim(), password);
        setSuccess(
          "If an account can be created with this email, a confirmation link will arrive in your inbox. If you already have an account, log in instead."
        );
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, mode));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === 'login';
  const isForgotPassword = mode === 'forgotPassword';

  return (
    <main className="auth-wrapper">
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="auth-brand">
          <img
            src="/images/replog-icon-1.png"
            alt=""
            className="auth-logo"
          />
          <p className="auth-eyebrow">YOUR TRAINING, TRACKED</p>
          <h1 id="auth-heading">
            {isForgotPassword ? 'Reset your password' : isLogin ? 'Welcome back' : 'Get started'}
          </h1>
          <p className="auth-subtitle">
            {isForgotPassword
              ? "Enter your account email and we'll send a reset link if an account exists."
              : isLogin
              ? 'Log in to pick up where your training left off.'
              : 'Create an account to start tracking your progress.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSubmitting}
          />

          {!isForgotPassword && (
            <>
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </>
          )}

          {isLogin && (
            <button
              className="auth-text-button forgot-password"
              type="button"
              onClick={() => switchMode('forgotPassword')}
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          )}

          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {success && <p className="auth-message auth-success" role="status">{success}</p>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (isForgotPassword ? 'Sending reset link…' : isLogin ? 'Logging in…' : 'Creating account…')
              : (isForgotPassword ? 'Send reset link' : isLogin ? 'Log in' : 'Create account')}
          </button>
        </form>

        {!isForgotPassword ? (
          <p className="switch-mode">
            {isLogin ? 'New to RepLog?' : 'Already have an account?'}
            <button
              type="button"
              onClick={() => switchMode(isLogin ? 'signup' : 'login')}
              disabled={isSubmitting}
            >
              {isLogin ? 'Create an account' : 'Log in'}
            </button>
          </p>
        ) : (
          <p className="switch-mode">
            Remember your password?
            <button type="button" onClick={() => switchMode('login')} disabled={isSubmitting}>
              Back to log in
            </button>
          </p>
        )}
      </section>
    </main>
  );
};

export default Authentication;
