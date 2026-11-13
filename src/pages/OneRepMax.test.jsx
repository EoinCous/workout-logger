import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  personalBests: [],
}));

vi.mock('../context/WorkoutContext', () => ({
  useWorkout: () => ({ personalBests: mocks.personalBests }),
}));

import OneRepMax from './OneRepMax';

afterEach(cleanup);

describe('OneRepMax', () => {
  it('uses the newest record and excludes older records for the same exercise', () => {
    mocks.personalBests = [
      {
        exerciseId: 'bench-press',
        name: 'Barbell Bench Press',
        weight: 75,
        reps: 10,
        date: '2026-10-20',
      },
      {
        exerciseId: 'bench-press',
        name: 'Barbell Bench Press',
        weight: 80,
        reps: 8,
        date: '2026-10-31',
      },
    ];

    render(<OneRepMax />);

    expect(screen.getAllByRole('option', { name: 'Barbell Bench Press' })).toHaveLength(1);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'bench-press' } });

    expect(screen.getByPlaceholderText('Enter weight').value).toBe('80');
    expect(screen.getByPlaceholderText('Enter reps').value).toBe('8');
  });
});
