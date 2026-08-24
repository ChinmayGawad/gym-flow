import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { QuickStats } from '@/components/dashboard/QuickStats';

describe('QuickStats', () => {
  it('renders the live occupancy numbers', () => {
    render(
      <QuickStats
        peopleCount={17}
        capacity={45}
        totalRegisteredMembers={120}
        waitTime="10 min"
      />
    );

    expect(screen.getByText('People Inside')).toBeInTheDocument();
    expect(screen.getByText('Estimated Waiting')).toBeInTheDocument();
    expect(screen.getByText('Registered Members')).toBeInTheDocument();
    expect(screen.getByText('Facility Capacity')).toBeInTheDocument();

    // "17 / 45" is split across spans
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('/ 45')).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
  });

  it('shows loading skeletons instead of values while fetching', () => {
    const { container } = render(
      <QuickStats peopleCount={17} capacity={45} totalRegisteredMembers={120} waitTime="10 min" isLoading />
    );

    expect(container.querySelectorAll('.animate-shimmer')).toHaveLength(12); // 4 cards x 3 skeleton blocks
    expect(screen.queryByText('People Inside')).not.toBeInTheDocument();
    expect(screen.queryByText('17')).not.toBeInTheDocument();
  });

  it('applies default capacity and membership values when omitted', () => {
    render(<QuickStats peopleCount={5} waitTime="0–5 min" />);

    expect(screen.getByText('/ 30')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument();
  });
});
