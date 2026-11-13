import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../context/AuthenticationContext', () => ({
  useAuthentication: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('../context/WorkoutContext', () => ({
  useWorkout: () => ({
    setTemplates: vi.fn(),
    personalBests: [
      {
        exerciseId: 'farmer-carries',
        name: 'Farmer Carries',
        trackingType: 'time',
        seconds: 90,
        weight: 20,
        date: '2026-10-31T10:00:00.000Z',
        achievedInWorkoutId: 'workout-1',
      },
      {
        exerciseId: 'farmer-carries',
        name: 'Farmer Carries',
        trackingType: 'time',
        seconds: 120,
        weight: 20,
        date: '2026-11-01T10:00:00.000Z',
        achievedInWorkoutId: 'workout-2',
      },
    ],
  }),
}));

vi.mock('../supabase/supabaseWorkoutService', () => ({
  fetchTemplates: vi.fn(),
  insertTemplate: vi.fn(),
}));

import WorkoutSummary from './WorkoutSummary';

afterEach(cleanup);

const renderSummary = (workout) => render(
  <MemoryRouter initialEntries={[{ pathname: '/workout-summary', state: { workout } }]}>
    <Routes>
      <Route path="/workout-summary" element={<WorkoutSummary />} />
    </Routes>
  </MemoryRouter>
);

describe('WorkoutSummary', () => {
  it('shows only personal bests achieved in the summarized workout', () => {
    renderSummary({
      date: '2026-10-31T10:00:00.000Z',
      completedAt: '2026-10-31T11:00:00.000Z',
      type: 'full',
      id: 'workout-1',
      exercises: [
        { id: 'farmer-carries', sets: [{ weight: '20', seconds: 90 }] },
        { id: 'bench-press', sets: [{ weight: '80', reps: '8' }] },
      ],
    });

    expect(screen.getAllByText('Duration')).toHaveLength(2);
    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.getAllByText('Reps')).toHaveLength(1);
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('1:30 best time · 20 kg')).toBeTruthy();
    expect(screen.queryByText('2:00 best time · 20 kg')).toBeNull();
    expect(screen.queryByText('Overhead Press')).toBeNull();
  });
});
