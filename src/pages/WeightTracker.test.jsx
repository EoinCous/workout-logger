import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: { id: 'user-1' },
  fetchBodyWeights: vi.fn(),
  upsertBodyWeight: vi.fn(),
  deleteBodyWeight: vi.fn(),
}));

vi.mock('../context/AuthenticationContext', () => ({
  useAuthentication: () => ({ user: mocks.user }),
}));

vi.mock('../supabase/supabaseWorkoutService', () => ({
  fetchBodyWeights: mocks.fetchBodyWeights,
  upsertBodyWeight: mocks.upsertBodyWeight,
  deleteBodyWeight: mocks.deleteBodyWeight,
}));

vi.mock('recharts', () => {
  const Container = ({ children }) => <div>{children}</div>;
  const Chart = ({ data }) => <div data-testid="weight-chart" data-chart-data={JSON.stringify(data)} />;
  const Element = () => null;
  return {
    CartesianGrid: Element,
    Line: Element,
    LineChart: Chart,
    ResponsiveContainer: Container,
    Tooltip: Element,
    XAxis: Element,
    YAxis: Element,
  };
});

import WeightTracker from './WeightTracker';

afterEach(cleanup);

describe('WeightTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = { id: 'user-1' };
    mocks.fetchBodyWeights.mockResolvedValue([
      { recordedDate: '2026-10-31', weight: 74.2 },
      { recordedDate: '2026-10-29', weight: 75 },
    ]);
    mocks.upsertBodyWeight.mockImplementation(async (userId, entry) => entry);
    mocks.deleteBodyWeight.mockResolvedValue(undefined);
  });

  it('displays saved entries and plots them in chronological order', async () => {
    render(<WeightTracker />);

    expect(await screen.findAllByText('74.2')).toHaveLength(2);
    expect(screen.getByText('75')).toBeTruthy();
    expect(JSON.parse(screen.getByTestId('weight-chart').dataset.chartData)).toEqual([
      { recordedDate: '2026-10-29', weight: 75 },
      { recordedDate: '2026-10-31', weight: 74.2 },
    ]);
    expect(screen.getByText('-0.8 kg')).toBeTruthy();
  });

  it('saves an entry and replaces a prior entry for that date', async () => {
    mocks.upsertBodyWeight.mockResolvedValue({
      recordedDate: '2026-10-31',
      weight: 73.5,
    });
    render(<WeightTracker />);

    await screen.findAllByText('74.2');
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-10-31' } });
    fireEvent.change(screen.getByLabelText('Weight (kg)'), { target: { value: '73.5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save weight' }));

    expect((await screen.findByRole('status')).textContent).toContain('Body weight saved.');
    expect(mocks.upsertBodyWeight).toHaveBeenCalledWith('user-1', {
      recordedDate: '2026-10-31',
      weight: 73.5,
    });
    expect(screen.getAllByText('73.5')).toHaveLength(2);
    expect(screen.queryByText('74.2')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('deletes an entry by its recorded date', async () => {
    render(<WeightTracker />);
    await screen.findAllByText('74.2');

    fireEvent.click(screen.getAllByRole('button', { name: /delete entry for/i })[0]);

    await waitFor(() => {
      expect(mocks.deleteBodyWeight).toHaveBeenCalledWith('user-1', '2026-10-31');
      expect(screen.queryByText('74.2')).toBeNull();
    });
  });
});
