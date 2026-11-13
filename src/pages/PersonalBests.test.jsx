import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  personalBests: [],
}));

vi.mock('../context/WorkoutContext', () => ({
  useWorkout: () => ({ personalBests: mocks.personalBests }),
}));

import PersonalBests from './PersonalBests';

afterEach(cleanup);

describe('PersonalBests', () => {
  it('shows the best timed duration while retaining weight and rep records', () => {
    mocks.personalBests = [
      {
        exerciseId: 'plank',
        name: 'Plank',
        muscle: 'core',
        trackingType: 'time',
        seconds: 60,
        weight: 0,
        date: '2026-10-20',
      },
      {
        exerciseId: 'plank',
        name: 'Plank',
        muscle: 'core',
        trackingType: 'time',
        seconds: 90,
        weight: 0,
        date: '2026-10-30',
      },
      {
        exerciseId: 'farmer-carries',
        name: 'Farmer Carries',
        muscle: 'forearms',
        trackingType: 'time',
        seconds: 30,
        weight: 20,
        date: '2026-10-30',
      },
      {
        exerciseId: 'bench-press',
        name: 'Barbell Bench Press',
        muscle: 'chest',
        weight: 80,
        reps: 8,
        date: '2026-10-30',
      },
    ];

    render(<PersonalBests />);

    expect(screen.getByText('Plank')).toBeTruthy();
    expect(screen.getByText('1:30')).toBeTruthy();
    expect(screen.queryByText('1:00')).toBeNull();
    expect(screen.getByText('best time')).toBeTruthy();
    expect(screen.getByText('0:30')).toBeTruthy();
    expect(screen.getByText('best time + 20 kg')).toBeTruthy();
    expect(screen.getByText('Barbell Bench Press')).toBeTruthy();
    expect(screen.getByText('80')).toBeTruthy();
    expect(screen.getByText('kg × 8 reps')).toBeTruthy();
  });
});
