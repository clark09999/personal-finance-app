import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/stat-card';
import { Activity } from 'lucide-react';

describe('StatCard', () => {
  it('renders title, value and subtitle correctly', () => {
    render(
      <StatCard
        title="Total Balance"
        value="$1,000"
        subtitle="Current balance across all accounts"
        icon={Activity}
        trend={{ value: '+10%', isPositive: true }}
      />
    );

    expect(screen.getByText('Total Balance')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('Current balance across all accounts')).toBeInTheDocument();
  });
});