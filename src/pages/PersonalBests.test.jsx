import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  workouts: [],
}));

vi.mock('../context/WorkoutContext', () => ({
  useWorkout: () => ({ workouts: mocks.workouts }),
}));

import PersonalBests from './PersonalBests';

afterEach(cleanup);

describe('PersonalBests', () => {
  it('shows the best timed duration while retaining weight and rep records', () => {
    mocks.workouts = [
      {
        date: '2026-10-30',
        exercises: [
          { id: 'plank', sets: [{ seconds: 90, weight: '0' }] },
          { id: 'farmer-carries', sets: [{ seconds: 30, weight: '20' }] },
          { id: 'bench-press', sets: [{ reps: '8', weight: '80' }] },
        ],
      },
    ];

    render(<PersonalBests />);

    expect(screen.getByText('Plank')).toBeTruthy();
    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.getByText('best time')).toBeTruthy();
    expect(screen.getByText('0:30')).toBeTruthy();
    expect(screen.getByText('best time · 20 kg')).toBeTruthy();
    expect(screen.getByText('Barbell Bench Press')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText('kg × 8 reps')).toBeTruthy();
  });
});
