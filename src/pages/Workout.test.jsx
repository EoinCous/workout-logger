import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  latestWorkouts: [],
}));

vi.mock('../context/WorkoutContext', () => ({
  useWorkout: () => ({
    status: 'idle',
    setCurrentPlan: vi.fn(),
    getLatestWorkouts: () => mocks.latestWorkouts,
    setStatus: vi.fn(),
    templates: [],
    setTemplates: vi.fn(),
  }),
}));

vi.mock('../context/AuthenticationContext', () => ({
  useAuthentication: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('../supabase/supabaseWorkoutService', () => ({
  deleteTemplate: vi.fn(),
}));

import Workout from './Workout';

afterEach(cleanup);

describe('Workout recent history', () => {
  it('shows timed sets as durations and keeps rep sets unchanged', () => {
    mocks.latestWorkouts = [{
      id: 'workout-1',
      type: 'Full Body',
      date: '2026-10-31',
      exercises: [
        { id: 'plank', sets: [{ weight: '0', seconds: 90 }] },
        { id: 'bench-press', sets: [{ weight: '80', reps: '8' }] },
      ],
    }];

    render(
      <MemoryRouter>
        <Workout />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Full Body'));

    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.getByText('80kg x 8')).toBeTruthy();
    expect(screen.queryByText('0kg x undefined')).toBeNull();
  });
});
