import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { deleteBodyWeight, fetchBodyWeights, upsertBodyWeight } from '../supabase/supabaseWorkoutService';
import { useAuthentication } from '../context/AuthenticationContext';
import '../css/WeightTracker.css';

const getToday = () => {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
};

const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const WeightTracker = () => {
  const { user } = useAuthentication();
  const [entries, setEntries] = useState([]);
  const [recordedDate, setRecordedDate] = useState(getToday);
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingDate, setDeletingDate] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadEntries = useCallback(async () => {
    if (!user?.id) {
      setEntries([]);
      setLoading(false);
      setError('Sign in to view your body weight history.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const bodyWeights = await fetchBodyWeights(user.id);
      setEntries(bodyWeights);
    } catch (loadError) {
      console.error('Failed to load body weight history:', loadError);
      setError('Unable to load your body weight history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const chronologicalEntries = useMemo(
    () => [...entries].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate)),
    [entries],
  );
  const latestEntry = entries[0] ?? null;
  const weightChange = chronologicalEntries.length > 1
    ? chronologicalEntries[chronologicalEntries.length - 1].weight - chronologicalEntries[0].weight
    : null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedWeight = Number(weight);
    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setError('Enter a body weight greater than zero.');
      return;
    }
    if (!user?.id) {
      setError('Sign in to save a body weight entry.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const savedEntry = await upsertBodyWeight(user.id, {
        recordedDate,
        weight: parsedWeight,
      });
      setEntries((currentEntries) => [
        savedEntry,
        ...currentEntries.filter((entry) => entry.recordedDate !== savedEntry.recordedDate),
      ].sort((a, b) => b.recordedDate.localeCompare(a.recordedDate)));
      setWeight('');
      setNotice('Body weight saved.');
    } catch (saveError) {
      console.error('Failed to save body weight:', saveError);
      setError('Unable to save your body weight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (date) => {
    if (!user?.id) {
      setError('Sign in to delete a body weight entry.');
      return;
    }

    setDeletingDate(date);
    setError('');
    setNotice('');
    try {
      await deleteBodyWeight(user.id, date);
      setEntries((currentEntries) => currentEntries.filter((entry) => entry.recordedDate !== date));
      setNotice(`Entry for ${formatDate(date)} deleted.`);
    } catch (deleteError) {
      console.error('Failed to delete body weight:', deleteError);
      setError('Unable to delete this entry. Please try again.');
    } finally {
      setDeletingDate(null);
    }
  };

  return (
    <main className="weight-tracker-page">
      <header className="weight-tracker-header">
        <div>
          <h1>Body Weight</h1>
          <p className="weight-tracker-intro">Record your weight to follow your trend over time.</p>
        </div>
        {latestEntry && (
          <div className="weight-tracker-latest">
            <span>Latest</span>
            <strong>{latestEntry.weight} <small>kg</small></strong>
            <time dateTime={latestEntry.recordedDate}>{formatDate(latestEntry.recordedDate)}</time>
          </div>
        )}
      </header>

      <section className="weight-tracker-card weight-tracker-entry">
        <h2>Add or update an entry</h2>
        <p>Saving a date that already has an entry will update it.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Date
            <input
              type="date"
              value={recordedDate}
              onChange={(event) => setRecordedDate(event.target.value)}
              required
            />
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              placeholder="e.g. 72.5"
              required
            />
          </label>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save weight'}
          </button>
        </form>
        {error && <p className="weight-tracker-message is-error" role="alert">{error}</p>}
        {notice && <p className="weight-tracker-message is-success" role="status">{notice}</p>}
      </section>

      <section className="weight-tracker-card" aria-labelledby="weight-trend-heading">
        <div className="weight-tracker-section-heading">
          <div>
            <h2 id="weight-trend-heading">Weight trend</h2>
          </div>
          {weightChange !== null && (
            <div className={`weight-tracker-change${weightChange > 0 ? ' is-up' : weightChange < 0 ? ' is-down' : ''}`}>
              <span>Since first entry</span>
              <strong>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg</strong>
            </div>
          )}
        </div>

        {loading ? (
          <p className="weight-tracker-empty" role="status">Loading weight history…</p>
        ) : entries.length > 0 ? (
          <div className="weight-tracker-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chronologicalEntries} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="var(--weight-grid)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="recordedDate"
                  tickFormatter={formatDate}
                  stroke="var(--weight-muted)"
                  minTickGap={24}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  width={48}
                  stroke="var(--weight-muted)"
                  tickFormatter={(value) => `${value} kg`}
                />
                <Tooltip
                  labelFormatter={formatDate}
                  formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Weight']}
                  contentStyle={{
                    background: 'var(--weight-card)',
                    border: '1px solid var(--weight-border)',
                    borderRadius: 8,
                    color: 'var(--coloursecondary)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--colouraccent)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--colouraccent)' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="weight-tracker-empty">
            {error ? 'Your history could not be loaded.' : 'No entries yet. Add your first weigh-in above to start tracking.'}
            {error && (
              <button type="button" className="weight-tracker-retry" onClick={loadEntries}>
                Try again
              </button>
            )}
          </p>
        )}
      </section>

      <section className="weight-tracker-card" aria-labelledby="weight-history-heading">
        <div className="weight-tracker-section-heading">
          <div>
            <h2 id="weight-history-heading">Entry history</h2>
            <p>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
          </div>
        </div>
        {entries.length > 0 ? (
          <ul className="weight-tracker-history">
            {entries.map((entry) => (
              <li key={entry.recordedDate}>
                <time dateTime={entry.recordedDate}>{formatDate(entry.recordedDate)}</time>
                <strong>{entry.weight} <span>kg</span></strong>
                <button
                  type="button"
                  className="weight-tracker-delete"
                  onClick={() => handleDelete(entry.recordedDate)}
                  disabled={deletingDate === entry.recordedDate}
                  aria-label={`Delete entry for ${formatDate(entry.recordedDate)}`}
                >
                  {deletingDate === entry.recordedDate ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        ) : !loading && (
          <p className="weight-tracker-empty">Your saved weigh-ins will appear here.</p>
        )}
      </section>
    </main>
  );
};

export default WeightTracker;