import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  workouts: [],
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useParams: () => ({ id: mocks.exerciseId }),
    useLocation: () => ({ state: { from: '/workout' } }),
  };
});

vi.mock('../context/WorkoutContext', () => ({
  useWorkout: () => ({ workouts: mocks.workouts }),
}));

vi.mock('recharts', () => {
  const Container = ({ children }) => <div>{children}</div>;
  const Chart = ({ data }) => <div data-testid="chart" data-chart-data={JSON.stringify(data)} />;
  const Element = () => null;
  return {
    LineChart: Chart,
    AreaChart: Chart,
    ResponsiveContainer: Container,
    Line: Element,
    Area: Element,
    XAxis: Element,
    YAxis: Element,
    Tooltip: Element,
    CartesianGrid: Element,
  };
});

import ExerciseDetail from './ExerciseDetail';

afterEach(cleanup);

const workout = (exerciseId, sets, date = '2026-10-30') => ({
  date,
  exercises: [{ id: exerciseId, sets }],
});

describe('ExerciseDetail', () => {
  beforeEach(() => {
    mocks.workouts = [];
  });

  it('shows best and total duration plus timed set history for time exercises', () => {
    mocks.exerciseId = 'plank';
    mocks.workouts = [
      workout('plank', [
        { weight: '0', seconds: 45 },
        { weight: '0', seconds: 90 },
      ]),
      workout('plank', [{ weight: '0', seconds: 60 }], '2026-10-31'),
    ];

    render(
      <MemoryRouter>
        <ExerciseDetail />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Best Duration')).toHaveLength(2);
    expect(screen.getAllByText('1:30').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Total Sets').parentElement.textContent).toContain('3');
    expect(screen.getByText('Total Duration')).toBeTruthy();
    expect(screen.getByText('1:30', { selector: '.set-details' })).toBeTruthy();
    expect(screen.getByText('0:45', { selector: '.set-details' })).toBeTruthy();
    expect(screen.queryByText('Strength (1RM)')).toBeNull();
    expect(JSON.parse(screen.getByTestId('chart').getAttribute('data-chart-data'))[0])
      .toMatchObject({ bestDuration: 90, duration: 135 });

    fireEvent.click(screen.getByRole('button', { name: 'Total Duration' }));
    expect(screen.getByRole('button', { name: 'Total Duration' })).toBeTruthy();
    expect(JSON.parse(screen.getByTestId('chart').getAttribute('data-chart-data'))[0].duration)
      .toBe(135);
  });

  it('keeps strength stats, chart labels, and history for rep exercises', () => {
    mocks.exerciseId = 'bench-press';
    mocks.workouts = [
      workout('bench-press', [{ weight: '80', reps: '8' }]),
    ];

    render(
      <MemoryRouter>
        <ExerciseDetail />
      </MemoryRouter>
    );

    expect(screen.getByText('Personal Record')).toBeTruthy();
    expect(screen.getByText('80', { selector: '.stat-value' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Strength (1RM)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volume' })).toBeTruthy();
    expect(screen.getByText('80kg x 8')).toBeTruthy();
  });
});
