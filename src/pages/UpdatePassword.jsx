import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthentication } from '../context/AuthenticationContext';
import '../css/Authentication.css';

const UpdatePassword = () => {
  const { user, updatePassword } = useAuthentication();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (updateError) {
      setError(updateError?.message || 'Unable to update your password. Request a new reset link and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-wrapper">
      <section className="auth-card" aria-labelledby="update-password-heading">
        <div className="auth-brand">
          <img src="/images/replog-icon-1.png" alt="" className="auth-logo" />
          <p className="auth-eyebrow">YOUR TRAINING, TRACKED</p>
          <h1 id="update-password-heading">
            {success ? 'Password updated' : 'Choose a new password'}
          </h1>
          <p className="auth-subtitle">
            {success
              ? 'Your password has been changed. You can continue to RepLog.'
              : 'Enter and confirm the new password for your account.'}
          </p>
        </div>

        {success ? (
          <button className="auth-submit" type="button" onClick={() => navigate('/')}>
            Continue to RepLog
          </button>
        ) : !user ? (
          <>
            <p className="auth-message auth-error" role="alert">
              This password reset link is invalid or has expired. Request a new link and try again.
            </p>
            <button className="auth-submit" type="button" onClick={() => navigate('/')}>
              Return to log in
            </button>
          </>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />

            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={isSubmitting}
            />

            {error && <p className="auth-message auth-error" role="alert">{error}</p>}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating password…' : 'Update password'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default UpdatePassword;
